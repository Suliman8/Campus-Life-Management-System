from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import os
import json

app = FastAPI(title="Analytics Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'postgres-db'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'campus_db'),
    'user': os.getenv('DB_USER', 'campus_user'),
    'password': os.getenv('DB_PASSWORD', 'campus_pass')
}

def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Response Models
class DashboardMetrics(BaseModel):
    total_students: int
    total_courses: int
    total_faculty: int
    active_enrollments: int
    avg_attendance: float
    avg_grade: float
    upcoming_events: int
    pending_payments: int

class EnrollmentTrend(BaseModel):
    date: str
    enrollments: int

class CourseAnalytics(BaseModel):
    course_id: str
    course_name: str
    enrolled_students: int
    avg_grade: float
    attendance_rate: float
    completion_rate: float

class StudentPerformance(BaseModel):
    student_id: str
    name: str
    gpa: float
    attendance_rate: float
    courses_enrolled: int
    courses_completed: int

class DepartmentStats(BaseModel):
    department: str
    total_students: int
    total_courses: int
    avg_gpa: float
    employment_rate: float

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "analytics-service", "timestamp": datetime.now().isoformat()}

@app.get("/dashboard/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    """Get main dashboard metrics"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        metrics = {}

        # Get total students
        cur.execute("SELECT COUNT(*) as count FROM students WHERE status = 'active'")
        metrics['total_students'] = cur.fetchone()['count'] or 0

        # Get total courses
        cur.execute("SELECT COUNT(*) as count FROM courses WHERE semester = 'current'")
        metrics['total_courses'] = cur.fetchone()['count'] or 0

        # Get total faculty
        cur.execute("SELECT COUNT(*) as count FROM users WHERE role = 'faculty'")
        metrics['total_faculty'] = cur.fetchone()['count'] or 0

        # Get active enrollments
        cur.execute("SELECT COUNT(*) as count FROM enrollments WHERE status = 'active'")
        metrics['active_enrollments'] = cur.fetchone()['count'] or 0

        # Get average attendance
        cur.execute("""
            SELECT AVG(attendance_percentage) as avg_attendance
            FROM attendance_summary
            WHERE month = EXTRACT(MONTH FROM CURRENT_DATE)
        """)
        result = cur.fetchone()
        metrics['avg_attendance'] = round(result['avg_attendance'] or 0, 2)

        # Get average grade
        cur.execute("SELECT AVG(grade_point) as avg_grade FROM grades WHERE semester = 'current'")
        result = cur.fetchone()
        metrics['avg_grade'] = round(result['avg_grade'] or 0, 2)

        # Get upcoming events count
        cur.execute("SELECT COUNT(*) as count FROM events WHERE date >= CURRENT_DATE")
        metrics['upcoming_events'] = cur.fetchone()['count'] or 0

        # Get pending payments
        cur.execute("SELECT COUNT(*) as count FROM payments WHERE status = 'pending'")
        metrics['pending_payments'] = cur.fetchone()['count'] or 0

        return DashboardMetrics(**metrics)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/enrollment/trends", response_model=List[EnrollmentTrend])
async def get_enrollment_trends(days: int = Query(30, description="Number of days to analyze")):
    """Get enrollment trends over time"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT
                DATE(enrolled_at) as date,
                COUNT(*) as enrollments
            FROM enrollments
            WHERE enrolled_at >= CURRENT_DATE - INTERVAL '%s days'
            GROUP BY DATE(enrolled_at)
            ORDER BY date
        """, (days,))

        results = cur.fetchall()
        return [EnrollmentTrend(date=str(r['date']), enrollments=r['enrollments']) for r in results]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/courses/analytics", response_model=List[CourseAnalytics])
async def get_course_analytics(department: Optional[str] = None):
    """Get detailed analytics for courses"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        query = """
            SELECT
                c.course_id,
                c.course_name,
                COUNT(DISTINCT e.student_id) as enrolled_students,
                AVG(g.grade_point) as avg_grade,
                AVG(a.attendance_percentage) as attendance_rate,
                SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)::float /
                    NULLIF(COUNT(e.student_id), 0) * 100 as completion_rate
            FROM courses c
            LEFT JOIN enrollments e ON c.course_id = e.course_id
            LEFT JOIN grades g ON c.course_id = g.course_id AND e.student_id = g.student_id
            LEFT JOIN attendance_summary a ON e.student_id = a.student_id
            WHERE c.semester = 'current'
        """

        if department:
            query += f" AND c.department = '{department}'"

        query += " GROUP BY c.course_id, c.course_name"

        cur.execute(query)
        results = cur.fetchall()

        return [
            CourseAnalytics(
                course_id=r['course_id'],
                course_name=r['course_name'],
                enrolled_students=r['enrolled_students'] or 0,
                avg_grade=round(r['avg_grade'] or 0, 2),
                attendance_rate=round(r['attendance_rate'] or 0, 2),
                completion_rate=round(r['completion_rate'] or 0, 2)
            ) for r in results
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/students/performance", response_model=List[StudentPerformance])
async def get_student_performance(
    limit: int = Query(10, description="Number of students to return"),
    order_by: str = Query("gpa", description="Sort by: gpa, attendance")
):
    """Get top performing students"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        order_column = "gpa" if order_by == "gpa" else "attendance_rate"

        cur.execute(f"""
            SELECT
                s.student_id,
                s.first_name || ' ' || s.last_name as name,
                COALESCE(AVG(g.grade_point), 0) as gpa,
                COALESCE(AVG(a.attendance_percentage), 0) as attendance_rate,
                COUNT(DISTINCT e.course_id) as courses_enrolled,
                SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END) as courses_completed
            FROM students s
            LEFT JOIN enrollments e ON s.student_id = e.student_id
            LEFT JOIN grades g ON s.student_id = g.student_id
            LEFT JOIN attendance_summary a ON s.student_id = a.student_id
            WHERE s.status = 'active'
            GROUP BY s.student_id, s.first_name, s.last_name
            ORDER BY {order_column} DESC
            LIMIT %s
        """, (limit,))

        results = cur.fetchall()

        return [
            StudentPerformance(
                student_id=r['student_id'],
                name=r['name'],
                gpa=round(r['gpa'], 2),
                attendance_rate=round(r['attendance_rate'], 2),
                courses_enrolled=r['courses_enrolled'],
                courses_completed=r['courses_completed']
            ) for r in results
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/departments/stats", response_model=List[DepartmentStats])
async def get_department_stats():
    """Get statistics by department"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        cur.execute("""
            SELECT
                d.department_name as department,
                COUNT(DISTINCT s.student_id) as total_students,
                COUNT(DISTINCT c.course_id) as total_courses,
                AVG(g.grade_point) as avg_gpa,
                (SELECT COUNT(*) FROM alumni WHERE department = d.department_name
                 AND employment_status = 'employed')::float /
                NULLIF((SELECT COUNT(*) FROM alumni WHERE department = d.department_name), 0) * 100
                as employment_rate
            FROM departments d
            LEFT JOIN students s ON s.department_id = d.department_id
            LEFT JOIN courses c ON c.department_id = d.department_id
            LEFT JOIN grades g ON g.student_id = s.student_id
            GROUP BY d.department_name
        """)

        results = cur.fetchall()

        return [
            DepartmentStats(
                department=r['department'],
                total_students=r['total_students'] or 0,
                total_courses=r['total_courses'] or 0,
                avg_gpa=round(r['avg_gpa'] or 0, 2),
                employment_rate=round(r['employment_rate'] or 0, 2)
            ) for r in results
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/attendance/analysis")
async def analyze_attendance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Analyze attendance patterns"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        query = """
            SELECT
                EXTRACT(DOW FROM date) as day_of_week,
                EXTRACT(HOUR FROM time) as hour,
                AVG(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100 as attendance_rate,
                COUNT(*) as total_sessions
            FROM attendance
        """

        conditions = []
        if start_date:
            conditions.append(f"date >= '{start_date}'")
        if end_date:
            conditions.append(f"date <= '{end_date}'")

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " GROUP BY EXTRACT(DOW FROM date), EXTRACT(HOUR FROM time)"

        cur.execute(query)
        results = cur.fetchall()

        # Process results into a heatmap format
        heatmap_data = {}
        for r in results:
            day = int(r['day_of_week'])
            hour = int(r['hour'])
            if day not in heatmap_data:
                heatmap_data[day] = {}
            heatmap_data[day][hour] = {
                'attendance_rate': round(r['attendance_rate'], 2),
                'sessions': r['total_sessions']
            }

        return {
            'heatmap': heatmap_data,
            'summary': {
                'best_day': max(heatmap_data.keys(), key=lambda d:
                    sum(h['attendance_rate'] for h in heatmap_data[d].values()) / len(heatmap_data[d])
                ) if heatmap_data else None,
                'worst_day': min(heatmap_data.keys(), key=lambda d:
                    sum(h['attendance_rate'] for h in heatmap_data[d].values()) / len(heatmap_data[d])
                ) if heatmap_data else None
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/grades/distribution")
async def get_grade_distribution(course_id: Optional[str] = None):
    """Get grade distribution analysis"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        query = """
            SELECT
                CASE
                    WHEN grade_point >= 4.0 THEN 'A'
                    WHEN grade_point >= 3.0 THEN 'B'
                    WHEN grade_point >= 2.0 THEN 'C'
                    WHEN grade_point >= 1.0 THEN 'D'
                    ELSE 'F'
                END as grade,
                COUNT(*) as count,
                AVG(grade_point) as avg_points
            FROM grades
            WHERE semester = 'current'
        """

        if course_id:
            query += f" AND course_id = '{course_id}'"

        query += " GROUP BY grade ORDER BY grade"

        cur.execute(query)
        results = cur.fetchall()

        total = sum(r['count'] for r in results)

        distribution = [
            {
                'grade': r['grade'],
                'count': r['count'],
                'percentage': round(r['count'] / total * 100, 2) if total > 0 else 0,
                'avg_points': round(r['avg_points'], 2)
            } for r in results
        ]

        return {
            'distribution': distribution,
            'total_students': total,
            'average_gpa': round(sum(r['avg_points'] * r['count'] for r in results) / total, 2) if total > 0 else 0
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/revenue/analysis")
async def analyze_revenue():
    """Analyze revenue and payment patterns"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Monthly revenue
        cur.execute("""
            SELECT
                DATE_TRUNC('month', payment_date) as month,
                SUM(amount) as revenue,
                COUNT(*) as transactions,
                AVG(amount) as avg_transaction
            FROM payments
            WHERE status = 'completed'
            AND payment_date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', payment_date)
            ORDER BY month
        """)

        monthly_revenue = cur.fetchall()

        # Payment method distribution
        cur.execute("""
            SELECT
                payment_method,
                COUNT(*) as count,
                SUM(amount) as total
            FROM payments
            WHERE status = 'completed'
            GROUP BY payment_method
        """)

        payment_methods = cur.fetchall()

        # Outstanding payments
        cur.execute("""
            SELECT
                SUM(amount) as total_outstanding,
                COUNT(*) as pending_payments,
                AVG(CURRENT_DATE - due_date) as avg_days_overdue
            FROM payments
            WHERE status = 'pending'
        """)

        outstanding = cur.fetchone()

        return {
            'monthly_revenue': [
                {
                    'month': str(r['month'])[:7],
                    'revenue': float(r['revenue'] or 0),
                    'transactions': r['transactions'],
                    'avg_transaction': float(r['avg_transaction'] or 0)
                } for r in monthly_revenue
            ],
            'payment_methods': [
                {
                    'method': r['payment_method'],
                    'count': r['count'],
                    'total': float(r['total'] or 0)
                } for r in payment_methods
            ],
            'outstanding': {
                'total': float(outstanding['total_outstanding'] or 0),
                'count': outstanding['pending_payments'] or 0,
                'avg_days_overdue': float(outstanding['avg_days_overdue'] or 0)
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/reports/generate")
async def generate_custom_report(report_type: str, filters: Dict[str, Any]):
    """Generate custom analytical reports"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        if report_type == "student_transcript":
            student_id = filters.get('student_id')
            cur.execute("""
                SELECT
                    c.course_name,
                    c.credits,
                    g.grade_point,
                    g.letter_grade,
                    e.semester
                FROM enrollments e
                JOIN courses c ON e.course_id = c.course_id
                LEFT JOIN grades g ON e.student_id = g.student_id AND e.course_id = g.course_id
                WHERE e.student_id = %s
                ORDER BY e.semester, c.course_name
            """, (student_id,))

            results = cur.fetchall()
            return {'transcript': results, 'generated_at': datetime.now().isoformat()}

        elif report_type == "faculty_workload":
            cur.execute("""
                SELECT
                    f.faculty_id,
                    f.name,
                    COUNT(DISTINCT c.course_id) as courses_teaching,
                    SUM(c.credits) as total_credits,
                    COUNT(DISTINCT e.student_id) as total_students
                FROM faculty f
                JOIN courses c ON f.faculty_id = c.instructor_id
                LEFT JOIN enrollments e ON c.course_id = e.course_id
                GROUP BY f.faculty_id, f.name
            """)

            results = cur.fetchall()
            return {'workload': results, 'generated_at': datetime.now().isoformat()}

        else:
            raise HTTPException(status_code=400, detail="Invalid report type")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3013)