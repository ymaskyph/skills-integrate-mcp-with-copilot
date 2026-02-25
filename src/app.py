"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"],
        "admins": []
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"],
        "admins": []
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"],
        "admins": []
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"],
        "admins": []
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"],
        "admins": []
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"],
        "admins": []
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"],
        "admins": []
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"],
        "admins": []
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"],
        "admins": []
    }
}


class ActivityModel(BaseModel):
    description: str
    schedule: str
    max_participants: int
    participants: Optional[List[str]] = []
    admins: Optional[List[str]] = []


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


@app.post("/activities")
def create_activity(name: str, activity: ActivityModel):
    """Create a new activity"""
    if name in activities:
        raise HTTPException(status_code=400, detail="Activity already exists")
    activities[name] = activity.model_dump()
    return {"message": f"Activity '{name}' created successfully"}


@app.put("/activities/{activity_name}")
def update_activity(activity_name: str, activity: ActivityModel):
    """Update an existing activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    updated = activity.model_dump()
    # Preserve existing participants and admins if not provided
    if not updated["participants"]:
        updated["participants"] = activities[activity_name]["participants"]
    if not updated["admins"]:
        updated["admins"] = activities[activity_name]["admins"]
    activities[activity_name] = updated
    return {"message": f"Activity '{activity_name}' updated successfully"}


@app.delete("/activities/{activity_name}")
def delete_activity(activity_name: str):
    """Delete an activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    del activities[activity_name]
    return {"message": f"Activity '{activity_name}' deleted successfully"}


@app.post("/activities/{activity_name}/assign-admin")
def assign_admin(activity_name: str, email: str):
    """Assign an admin to an activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity = activities[activity_name]
    if email in activity["admins"]:
        raise HTTPException(status_code=400, detail="User is already an admin")
    activity["admins"].append(email)
    return {"message": f"Assigned {email} as admin for {activity_name}"}


@app.delete("/activities/{activity_name}/remove-admin")
def remove_admin(activity_name: str, email: str):
    """Remove an admin from an activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity = activities[activity_name]
    if email not in activity["admins"]:
        raise HTTPException(status_code=400, detail="User is not an admin")
    activity["admins"].remove(email)
    return {"message": f"Removed {email} as admin for {activity_name}"}
