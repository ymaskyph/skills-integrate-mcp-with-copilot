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

        // Also populate complaint activity dropdown
        const complaintOption = document.createElement("option");
        complaintOption.value = name;
        complaintOption.textContent = name;
        document.getElementById("complaint-activity").appendChild(complaintOption);
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

  // Handle complaint form submission
  const complaintForm = document.getElementById("complaint-form");
  const complaintMessageDiv = document.getElementById("complaint-message");

  complaintForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("complaint-email").value;
    const activityName = document.getElementById("complaint-activity").value;
    const description = document.getElementById("complaint-description").value;

    try {
      const response = await fetch("/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, activity_name: activityName, description }),
      });
      const result = await response.json();
      if (response.ok) {
        complaintMessageDiv.textContent = result.message;
        complaintMessageDiv.className = "success";
        complaintForm.reset();
      } else {
        complaintMessageDiv.textContent = result.detail || "An error occurred";
        complaintMessageDiv.className = "error";
      }
      complaintMessageDiv.classList.remove("hidden");
      setTimeout(() => complaintMessageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      complaintMessageDiv.textContent = "Failed to submit complaint. Please try again.";
      complaintMessageDiv.className = "error";
      complaintMessageDiv.classList.remove("hidden");
      console.error("Error submitting complaint:", error);
    }
  });

  // Handle complaint history lookup
  const historyForm = document.getElementById("history-form");
  const complaintHistoryList = document.getElementById("complaint-history-list");

  historyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("history-email").value;

    try {
      const response = await fetch(`/complaints/by-email/${encodeURIComponent(email)}`);
      const complaints = await response.json();
      complaintHistoryList.innerHTML = "";
      const entries = Object.values(complaints);
      if (entries.length === 0) {
        complaintHistoryList.innerHTML = "<p><em>No complaints found.</em></p>";
        return;
      }
      entries.forEach((c) => {
        const card = document.createElement("div");
        card.className = "complaint-card";
        card.innerHTML = `
          <p><strong>Activity:</strong> ${c.activity_name}</p>
          <p><strong>Description:</strong> ${c.description}</p>
          <p><strong>Status:</strong> <span class="complaint-status ${c.status}">${c.status}</span></p>
          <p><strong>Submitted:</strong> ${new Date(c.submitted_at).toLocaleString()}</p>
          ${c.admin_response ? `<p><strong>Admin Response:</strong> ${c.admin_response}</p>` : ""}
        `;
        complaintHistoryList.appendChild(card);
      });
    } catch (error) {
      complaintHistoryList.innerHTML = "<p>Failed to load complaints.</p>";
      console.error("Error loading complaint history:", error);
    }
  });

  // Handle admin complaints management
  const loadAllComplaintsBtn = document.getElementById("load-all-complaints");
  const allComplaintsList = document.getElementById("all-complaints-list");

  loadAllComplaintsBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/complaints");
      const complaints = await response.json();
      allComplaintsList.innerHTML = "";
      const entries = Object.values(complaints);
      if (entries.length === 0) {
        allComplaintsList.innerHTML = "<p><em>No complaints found.</em></p>";
        return;
      }
      entries.forEach((c) => {
        const card = document.createElement("div");
        card.className = "complaint-card";
        card.innerHTML = `
          <p><strong>From:</strong> ${c.email}</p>
          <p><strong>Activity:</strong> ${c.activity_name}</p>
          <p><strong>Description:</strong> ${c.description}</p>
          <p><strong>Status:</strong> <span class="complaint-status ${c.status}">${c.status}</span></p>
          <p><strong>Submitted:</strong> ${new Date(c.submitted_at).toLocaleString()}</p>
          ${c.admin_response ? `<p><strong>Your Response:</strong> ${c.admin_response}</p>` : `
            <div class="form-group">
              <textarea class="admin-response-text" placeholder="Enter your response..." rows="2"></textarea>
            </div>
            <button class="respond-btn" data-id="${c.id}">Submit Response</button>
          `}
        `;
        allComplaintsList.appendChild(card);
      });

      // Attach respond button listeners
      allComplaintsList.querySelectorAll(".respond-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const complaintId = btn.getAttribute("data-id");
          const textarea = btn.previousElementSibling.querySelector("textarea");
          const responseText = textarea.value.trim();
          if (!responseText) return;

          try {
            const res = await fetch(`/complaints/${encodeURIComponent(complaintId)}/respond`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ response: responseText }),
            });
            if (res.ok) {
              loadAllComplaintsBtn.click();
            }
          } catch (err) {
            console.error("Error submitting response:", err);
          }
        });
      });
    } catch (error) {
      allComplaintsList.innerHTML = "<p>Failed to load complaints.</p>";
      console.error("Error loading all complaints:", error);
    }
  });
});
