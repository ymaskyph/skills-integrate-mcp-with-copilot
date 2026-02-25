"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import os
import json
import uuid
from datetime import datetime
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# JSON file path for complaints
COMPLAINTS_FILE = os.path.join(current_dir, "complaints.json")


def load_complaints() -> list:
    if os.path.exists(COMPLAINTS_FILE):
        with open(COMPLAINTS_FILE, "r") as f:
            return json.load(f)
    return []


def save_complaints(complaints: list):
    with open(COMPLAINTS_FILE, "w") as f:
        json.dump(complaints, f, indent=2)


class ComplaintRequest(BaseModel):
    email: str
    activity: str
    complaint: str


class ResponseRequest(BaseModel):
    admin_response: str

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


@app.post("/complaints")
def submit_complaint(request: ComplaintRequest):
    """Submit a complaint about an activity"""
    if request.activity not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    complaints = load_complaints()
    complaint = {
        "id": str(uuid.uuid4()),
        "email": request.email,
        "activity": request.activity,
        "complaint": request.complaint,
        "created_at": datetime.utcnow().isoformat(),
        "status": "pending",
        "admin_response": None
    }
    complaints.append(complaint)
    save_complaints(complaints)
    return {"message": "Complaint submitted successfully", "id": complaint["id"]}


@app.get("/complaints")
def get_all_complaints():
    """Get all complaints (admin view)"""
    return load_complaints()


@app.post("/complaints/{complaint_id}/respond")
def respond_to_complaint(complaint_id: str, request: ResponseRequest):
    """Respond to a complaint (admin only)"""
    complaints = load_complaints()
    for complaint in complaints:
        if complaint["id"] == complaint_id:
            complaint["admin_response"] = request.admin_response
            complaint["status"] = "responded"
            save_complaints(complaints)
            return {"message": "Response submitted successfully"}
    raise HTTPException(status_code=404, detail="Complaint not found")


@app.get("/complaints/user/{email}")
def get_user_complaints(email: str):
    """Get all complaints submitted by a specific user"""
    complaints = load_complaints()
    return [c for c in complaints if c["email"] == email]
