"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")


# Persistent activity database using JSON file
import json

ACTIVITIES_FILE = os.path.join(current_dir, "activities.json")

def load_activities():
    if not os.path.exists(ACTIVITIES_FILE):
        return {}
    with open(ACTIVITIES_FILE, "r") as f:
        return json.load(f)

def save_activities(activities):
    with open(ACTIVITIES_FILE, "w") as f:
        json.dump(activities, f, indent=2)

def get_activities_data():
    return load_activities()

def set_activities_data(activities):
    save_activities(activities)


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")



@app.get("/activities")
def get_activities():
    return get_activities_data()



@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    activities = get_activities_data()
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity = activities[activity_name]
    if email in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is already signed up")
    activity["participants"].append(email)
    set_activities_data(activities)
    return {"message": f"Signed up {email} for {activity_name}"}



@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    activities = get_activities_data()
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity = activities[activity_name]
    if email not in activity["participants"]:
        raise HTTPException(status_code=400, detail="Student is not signed up for this activity")
    activity["participants"].remove(email)
    set_activities_data(activities)
    return {"message": f"Unregistered {email} from {activity_name}"}
# Add CRUD endpoints for activities

from pydantic import BaseModel

class Activity(BaseModel):
    description: str
    participants: list[str] = []

@app.post("/activities")
def create_activity(activity_name: str, activity: Activity):
    activities = get_activities_data()
    if activity_name in activities:
        raise HTTPException(status_code=400, detail="Activity already exists")
    activities[activity_name] = activity.dict()
    set_activities_data(activities)
    return {"message": f"Created activity {activity_name}"}

@app.put("/activities/{activity_name}")
def update_activity(activity_name: str, activity: Activity):
    activities = get_activities_data()
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    activities[activity_name]["description"] = activity.description
    # Optionally allow updating participants
    activities[activity_name]["participants"] = activity.participants
    set_activities_data(activities)
    return {"message": f"Updated activity {activity_name}"}

@app.delete("/activities/{activity_name}")
def delete_activity(activity_name: str):
    activities = get_activities_data()
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")
    del activities[activity_name]
    set_activities_data(activities)
    return {"message": f"Deleted activity {activity_name}"}
