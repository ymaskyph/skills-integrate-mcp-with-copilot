document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear and repopulate all activity selects
      [activitySelect, document.getElementById("feedback-activity"), document.getElementById("assign-activity")].forEach(sel => {
        while (sel.options.length > 1) sel.remove(1);
      });

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to all activity selects
        [activitySelect, document.getElementById("feedback-activity"), document.getElementById("assign-activity")].forEach(sel => {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          sel.appendChild(option);
        });
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // --- Feedback / Complaint form ---
  const feedbackForm = document.getElementById("feedback-form");
  const feedbackStatus = document.getElementById("feedback-message-status");

  feedbackForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("feedback-email").value;
    const activity = document.getElementById("feedback-activity").value;
    const type = document.getElementById("feedback-type").value;
    const message = document.getElementById("feedback-message").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, feedback_type: type, message }),
        }
      );
      const result = await response.json();
      feedbackStatus.textContent = response.ok ? result.message : (result.detail || "An error occurred");
      feedbackStatus.className = response.ok ? "success" : "error";
      feedbackStatus.classList.remove("hidden");
      if (response.ok) feedbackForm.reset();
      setTimeout(() => feedbackStatus.classList.add("hidden"), 5000);
    } catch (error) {
      feedbackStatus.textContent = "Failed to submit. Please try again.";
      feedbackStatus.className = "error";
      feedbackStatus.classList.remove("hidden");
      console.error("Error submitting feedback:", error);
    }
  });

  // --- User Dashboard ---
  const dashboardForm = document.getElementById("dashboard-form");
  const dashboardContent = document.getElementById("dashboard-content");

  dashboardForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("dashboard-email").value;

    try {
      const response = await fetch(`/dashboard/${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        dashboardContent.innerHTML = `<p class="error">${data.detail || "Error loading dashboard"}</p>`;
        dashboardContent.classList.remove("hidden");
        return;
      }

      const signupsHTML = data.signups.length > 0
        ? `<ul>${data.signups.map(s => `<li><strong>${s.activity}</strong> — ${s.schedule}</li>`).join("")}</ul>`
        : "<p><em>No activity signups found.</em></p>";

      const feedbackHTML = data.feedback.length > 0
        ? `<ul>${data.feedback.map(f =>
            `<li><span class="badge badge-${f.type}">${f.type}</span> <strong>${f.activity}</strong>: ${f.message} <small>(${f.submitted_at.slice(0,10)})</small></li>`
          ).join("")}</ul>`
        : "<p><em>No feedback or complaints submitted.</em></p>";

      const managedHTML = data.managed_activities.length > 0
        ? `<ul>${data.managed_activities.map(m =>
            `<li><strong>${m.activity}</strong> — assigned by ${m.assigned_by} on ${m.assigned_at.slice(0,10)}</li>`
          ).join("")}</ul>`
        : "<p><em>No activities managed.</em></p>";

      dashboardContent.innerHTML = `
        <h4>Dashboard for ${email}</h4>
        <h5>📋 Activity Signups</h5>${signupsHTML}
        <h5>💬 Feedback &amp; Complaints</h5>${feedbackHTML}
        <h5>🗂 Managed Activities</h5>${managedHTML}
      `;
      dashboardContent.classList.remove("hidden");
    } catch (error) {
      dashboardContent.innerHTML = "<p class='error'>Failed to load dashboard.</p>";
      dashboardContent.classList.remove("hidden");
      console.error("Error loading dashboard:", error);
    }
  });

  // --- Supervisor Assignment ---
  const assignmentForm = document.getElementById("assignment-form");
  const assignmentMessage = document.getElementById("assignment-message");
  const assignmentsList = document.getElementById("assignments-list");
  const assignmentsContent = document.getElementById("assignments-content");
  const loadAssignmentsBtn = document.getElementById("load-assignments-btn");

  assignmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const supervisorEmail = document.getElementById("supervisor-email").value;
    const activityName = document.getElementById("assign-activity").value;
    const assignTo = document.getElementById("assign-to").value;

    try {
      const response = await fetch("/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_name: activityName,
          assigned_to: assignTo,
          assigned_by: supervisorEmail,
        }),
      });
      const result = await response.json();
      assignmentMessage.textContent = response.ok ? result.message : (result.detail || "An error occurred");
      assignmentMessage.className = response.ok ? "success" : "error";
      assignmentMessage.classList.remove("hidden");
      if (response.ok) {
        assignmentForm.reset();
        loadAssignments();
      }
      setTimeout(() => assignmentMessage.classList.add("hidden"), 5000);
    } catch (error) {
      assignmentMessage.textContent = "Failed to save assignment.";
      assignmentMessage.className = "error";
      assignmentMessage.classList.remove("hidden");
      console.error("Error assigning:", error);
    }
  });

  async function loadAssignments() {
    try {
      const response = await fetch("/assignments");
      const data = await response.json();
      const entries = Object.entries(data);
      assignmentsContent.innerHTML = entries.length > 0
        ? `<ul>${entries.map(([activity, info]) =>
            `<li><strong>${activity}</strong>: managed by ${info.assigned_to}
              (assigned by ${info.assigned_by})
              <button class="delete-btn" data-assignment="${activity}">❌</button></li>`
          ).join("")}</ul>`
        : "<p><em>No assignments yet.</em></p>";
      assignmentsList.classList.remove("hidden");

      assignmentsContent.querySelectorAll(".delete-btn[data-assignment]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const name = btn.getAttribute("data-assignment");
          await fetch(`/assignments/${encodeURIComponent(name)}`, { method: "DELETE" });
          loadAssignments();
        });
      });
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  }

  loadAssignmentsBtn.addEventListener("click", loadAssignments);

  // Initialize app
  fetchActivities();
});
