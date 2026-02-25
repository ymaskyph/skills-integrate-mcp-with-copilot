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
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

ACTIVITIES_FILE = current_dir / "activities.json"


def load_activities():
    with open(ACTIVITIES_FILE, "r") as f:
        return json.load(f)


def save_activities(data):
    with open(ACTIVITIES_FILE, "w") as f:
        json.dump(data, f, indent=2)


# Load activities from JSON file
activities = load_activities()


class ActivityModel(BaseModel):
    description: str
    schedule: str
    max_participants: int


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
    save_activities(activities)
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
    save_activities(activities)
    return {"message": f"Unregistered {email} from {activity_name}"}


@app.post("/activities")
def create_activity(name: str, activity: ActivityModel):
    """Create a new activity"""
    if name in activities:
        raise HTTPException(status_code=400, detail="Activity already exists")
    activities[name] = {
        "description": activity.description,
        "schedule": activity.schedule,
        "max_participants": activity.max_participants,
        "participants": []
    }
    save_activities(activities)
    return {"message": f"Activity '{name}' created successfully"}


@app.put("/activities/{activity_name}")
def update_activity(activity_name: str, activity: ActivityModel):
    """Update an existing activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    activities[activity_name].update({
        "description": activity.description,
        "schedule": activity.schedule,
        "max_participants": activity.max_participants
    })
    save_activities(activities)
    return {"message": f"Activity '{activity_name}' updated successfully"}


@app.delete("/activities/{activity_name}")
def delete_activity(activity_name: str):
    """Delete an activity"""
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    del activities[activity_name]
    save_activities(activities)
    return {"message": f"Activity '{activity_name}' deleted successfully"}
