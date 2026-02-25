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

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
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

  // Initialize app
  fetchActivities();

  // Dashboard logic
  const viewDashboardBtn = document.getElementById("view-dashboard-btn");
  const dashboardContent = document.getElementById("dashboard-content");
  const dashboardMessage = document.getElementById("dashboard-message");

  function showDashboardMessage(text, type) {
    dashboardMessage.textContent = text;
    dashboardMessage.className = type;
    dashboardMessage.classList.remove("hidden");
    setTimeout(() => dashboardMessage.classList.add("hidden"), 5000);
  }

  async function loadDashboard(email) {
    try {
      const response = await fetch(`/students/${encodeURIComponent(email)}/dashboard`);
      const data = await response.json();

      // Signups
      const signupsList = document.getElementById("dashboard-signups");
      signupsList.innerHTML = data.signups.length
        ? data.signups.map(s => `<li><strong>${s.activity}</strong> — ${s.schedule}</li>`).join("")
        : "<li><em>No signups yet</em></li>";

      // Complaints
      const complaintsList = document.getElementById("dashboard-complaints");
      complaintsList.innerHTML = data.complaints.length
        ? data.complaints.map(c => `<li>${c.message} <span class="timestamp">(${c.submitted_at})</span></li>`).join("")
        : "<li><em>No complaints submitted</em></li>";

      // Feedback
      const feedbackList = document.getElementById("dashboard-feedback");
      feedbackList.innerHTML = data.feedback.length
        ? data.feedback.map(f => `<li>${f.message} <span class="timestamp">(${f.submitted_at})</span></li>`).join("")
        : "<li><em>No feedback submitted</em></li>";

      dashboardContent.classList.remove("hidden");
    } catch (error) {
      showDashboardMessage("Failed to load dashboard. Please try again.", "error");
      console.error("Error loading dashboard:", error);
    }
  }

  viewDashboardBtn.addEventListener("click", () => {
    const email = document.getElementById("dashboard-email").value.trim();
    if (!email) {
      showDashboardMessage("Please enter your email address.", "error");
      return;
    }
    loadDashboard(email);
  });

  document.getElementById("complaint-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("dashboard-email").value.trim();
    const message = document.getElementById("complaint-text").value.trim();
    if (!message) return;
    try {
      const response = await fetch(`/students/${encodeURIComponent(email)}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = await response.json();
      if (response.ok) {
        document.getElementById("complaint-text").value = "";
        showDashboardMessage("Complaint submitted successfully.", "success");
        loadDashboard(email);
      } else {
        showDashboardMessage(result.detail || "An error occurred.", "error");
      }
    } catch (error) {
      showDashboardMessage("Failed to submit complaint. Please try again.", "error");
      console.error("Error submitting complaint:", error);
    }
  });

  document.getElementById("feedback-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("dashboard-email").value.trim();
    const message = document.getElementById("feedback-text").value.trim();
    if (!message) return;
    try {
      const response = await fetch(`/students/${encodeURIComponent(email)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = await response.json();
      if (response.ok) {
        document.getElementById("feedback-text").value = "";
        showDashboardMessage("Feedback submitted successfully.", "success");
        loadDashboard(email);
      } else {
        showDashboardMessage(result.detail || "An error occurred.", "error");
      }
    } catch (error) {
      showDashboardMessage("Failed to submit feedback. Please try again.", "error");
      console.error("Error submitting feedback:", error);
    }
  });
});
