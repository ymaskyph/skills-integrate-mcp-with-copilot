"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import json
import os
from datetime import datetime
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# JSON data file paths
DATA_DIR = current_dir / "data"
ASSIGNMENTS_FILE = DATA_DIR / "assignments.json"
FEEDBACK_FILE = DATA_DIR / "feedback.json"


def load_json(path: Path) -> dict:
    if path.exists():
        with open(path, "r") as f:
            return json.load(f)
    return {}


def save_json(path: Path, data: dict):
    DATA_DIR.mkdir(exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


class AssignmentRequest(BaseModel):
    activity_name: str
    assigned_to: str
    assigned_by: str


class FeedbackRequest(BaseModel):
    email: str
    feedback_type: str  # "complaint" or "feedback"
    message: str

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"]
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"]
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"]
    }
}


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}


# --- Assignments ---

@app.get("/assignments")
def get_assignments():
    """Get all activity-to-teacher/admin assignments"""
    return load_json(ASSIGNMENTS_FILE)


@app.post("/assignments")
def assign_activity(request: AssignmentRequest):
    """Supervisor assigns a teacher/admin to manage an activity"""
    if request.activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    assignments = load_json(ASSIGNMENTS_FILE)
    assignments[request.activity_name] = {
        "assigned_to": request.assigned_to,
        "assigned_by": request.assigned_by,
        "assigned_at": datetime.utcnow().isoformat()
    }
    save_json(ASSIGNMENTS_FILE, assignments)
    return {"message": f"Assigned {request.assigned_to} to manage {request.activity_name}"}


@app.delete("/assignments/{activity_name}")
def remove_assignment(activity_name: str):
    """Remove a teacher/admin assignment from an activity"""
    assignments = load_json(ASSIGNMENTS_FILE)
    if activity_name not in assignments:
        raise HTTPException(status_code=404, detail="Assignment not found")
    del assignments[activity_name]
    save_json(ASSIGNMENTS_FILE, assignments)
    return {"message": f"Removed assignment for {activity_name}"}


# --- Feedback / Complaints ---

@app.post("/activities/{activity_name}/feedback")
def submit_feedback(activity_name: str, request: FeedbackRequest):
    """Submit feedback or a complaint for an activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    if request.feedback_type not in ("complaint", "feedback"):
        raise HTTPException(status_code=400, detail="feedback_type must be 'complaint' or 'feedback'")

    all_feedback = load_json(FEEDBACK_FILE)
    user_entries = all_feedback.get(request.email, [])
    user_entries.append({
        "activity": activity_name,
        "type": request.feedback_type,
        "message": request.message,
        "submitted_at": datetime.utcnow().isoformat(),
        "status": "open"
    })
    all_feedback[request.email] = user_entries
    save_json(FEEDBACK_FILE, all_feedback)
    return {"message": f"Submitted {request.feedback_type} for {activity_name}"}


# --- User Dashboard ---

@app.get("/dashboard/{email}")
def get_dashboard(email: str):
    """Get a user dashboard with their signups, complaints, and feedback"""
    # Signups: find all activities the user is enrolled in
    signups = [
        {"activity": name, "schedule": details["schedule"]}
        for name, details in activities.items()
        if email in details["participants"]
    ]

    # Feedback / complaints submitted by this user
    all_feedback = load_json(FEEDBACK_FILE)
    user_feedback = all_feedback.get(email, [])

    # Assignments managed by this user (as a teacher/admin)
    assignments = load_json(ASSIGNMENTS_FILE)
    managed = [
        {"activity": name, "assigned_by": info["assigned_by"], "assigned_at": info["assigned_at"]}
        for name, info in assignments.items()
        if info.get("assigned_to") == email
    ]

    return {
        "email": email,
        "signups": signups,
        "feedback": user_feedback,
        "managed_activities": managed
    }
