document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const manageForm = document.getElementById("manage-form");
  const manageTitle = document.getElementById("manage-title");
  const manageSubmitBtn = document.getElementById("manage-submit-btn");
  const manageCancelBtn = document.getElementById("manage-cancel-btn");
  const manageMessageDiv = document.getElementById("manage-message");
  const editActivityNameInput = document.getElementById("edit-activity-name");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and dropdown options (except placeholder)
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

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
          <div class="activity-actions">
            <button class="edit-activity-btn" data-activity="${name}"
              data-description="${details.description}"
              data-schedule="${details.schedule}"
              data-max="${details.max_participants}">✏️ Edit</button>
            <button class="delete-activity-btn" data-activity="${name}">🗑️ Delete</button>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to participant delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to activity edit buttons
      document.querySelectorAll(".edit-activity-btn").forEach((button) => {
        button.addEventListener("click", handleEditActivity);
      });

      // Add event listeners to activity delete buttons
      document.querySelectorAll(".delete-activity-btn").forEach((button) => {
        button.addEventListener("click", handleDeleteActivity);
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

  // Handle editing an activity (populate form)
  function handleEditActivity(event) {
    const button = event.target;
    const name = button.getAttribute("data-activity");
    editActivityNameInput.value = name;
    document.getElementById("activity-name").value = name;
    document.getElementById("activity-name").disabled = true;
    document.getElementById("activity-description").value = button.getAttribute("data-description");
    document.getElementById("activity-schedule").value = button.getAttribute("data-schedule");
    document.getElementById("activity-max").value = button.getAttribute("data-max");
    manageTitle.textContent = "Edit Activity";
    manageSubmitBtn.textContent = "Save Changes";
    manageCancelBtn.classList.remove("hidden");
    document.getElementById("manage-container").scrollIntoView({ behavior: "smooth" });
  }

  // Reset manage form to "Add" mode
  function resetManageForm() {
    editActivityNameInput.value = "";
    manageForm.reset();
    document.getElementById("activity-name").disabled = false;
    manageTitle.textContent = "Add New Activity";
    manageSubmitBtn.textContent = "Add Activity";
    manageCancelBtn.classList.add("hidden");
  }

  manageCancelBtn.addEventListener("click", resetManageForm);

  // Handle delete activity
  async function handleDeleteActivity(event) {
    const button = event.target;
    const name = button.getAttribute("data-activity");
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/activities/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok) {
        manageMessageDiv.textContent = result.message;
        manageMessageDiv.className = "success";
        fetchActivities();
      } else {
        manageMessageDiv.textContent = result.detail || "An error occurred";
        manageMessageDiv.className = "error";
      }

      manageMessageDiv.classList.remove("hidden");
      setTimeout(() => manageMessageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      manageMessageDiv.textContent = "Failed to delete activity. Please try again.";
      manageMessageDiv.className = "error";
      manageMessageDiv.classList.remove("hidden");
      console.error("Error deleting activity:", error);
    }
  }

  // Handle add/edit activity form submission
  manageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const editingName = editActivityNameInput.value;
    const name = document.getElementById("activity-name").value.trim();
    const description = document.getElementById("activity-description").value.trim();
    const schedule = document.getElementById("activity-schedule").value.trim();
    const max_participants = parseInt(document.getElementById("activity-max").value, 10);
    const body = JSON.stringify({ description, schedule, max_participants });

    try {
      let response;
      if (editingName) {
        response = await fetch(`/activities/${encodeURIComponent(editingName)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body,
        });
      } else {
        response = await fetch(`/activities?name=${encodeURIComponent(name)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      }

      const result = await response.json();

      if (response.ok) {
        manageMessageDiv.textContent = result.message;
        manageMessageDiv.className = "success";
        resetManageForm();
        fetchActivities();
      } else {
        manageMessageDiv.textContent = result.detail || "An error occurred";
        manageMessageDiv.className = "error";
      }

      manageMessageDiv.classList.remove("hidden");
      setTimeout(() => manageMessageDiv.classList.add("hidden"), 5000);
    } catch (error) {
      manageMessageDiv.textContent = "Failed to save activity. Please try again.";
      manageMessageDiv.className = "error";
      manageMessageDiv.classList.remove("hidden");
      console.error("Error saving activity:", error);
    }
  });

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
});
