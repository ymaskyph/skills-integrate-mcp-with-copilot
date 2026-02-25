document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const adminActivitySelect = document.getElementById("admin-activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const adminMessageDiv = document.getElementById("admin-message");
  const addActivityForm = document.getElementById("add-activity-form");
  const showAddActivityBtn = document.getElementById("show-add-activity-btn");
  const cancelActivityBtn = document.getElementById("cancel-activity-btn");
  const assignAdminForm = document.getElementById("assign-admin-form");
  const activityFormTitle = document.getElementById("activity-form-title");
  const activityFormSubmit = document.getElementById("activity-form-submit");
  const editActivityNameInput = document.getElementById("edit-activity-name");

  // Show/hide add activity form
  showAddActivityBtn.addEventListener("click", () => {
    editActivityNameInput.value = "";
    document.getElementById("new-activity-name").value = "";
    document.getElementById("new-activity-name").disabled = false;
    document.getElementById("new-activity-description").value = "";
    document.getElementById("new-activity-schedule").value = "";
    document.getElementById("new-activity-max").value = "";
    activityFormTitle.textContent = "Add New Activity";
    activityFormSubmit.textContent = "Add Activity";
    addActivityForm.classList.remove("hidden");
    showAddActivityBtn.classList.add("hidden");
  });

  cancelActivityBtn.addEventListener("click", () => {
    addActivityForm.classList.add("hidden");
    showAddActivityBtn.classList.remove("hidden");
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      adminActivitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

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

        // Create admins HTML
        const admins = details.admins || [];
        const adminsHTML = admins.length > 0
          ? `<div class="admins-section">
              <h5>Admins:</h5>
              <ul class="admins-list">
                ${admins.map(email =>
                  `<li><span class="participant-email">${email}</span><button class="remove-admin-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                ).join("")}
              </ul>
            </div>`
          : `<div class="admins-section"><h5>Admins:</h5><p><em>No admins assigned</em></p></div>`;

        activityCard.innerHTML = `
          <div class="activity-card-header">
            <h4>${name}</h4>
            <div class="activity-actions">
              <button class="edit-activity-btn btn-small btn-edit" data-activity="${name}">✏️ Edit</button>
              <button class="delete-activity-btn btn-small btn-danger" data-activity="${name}">🗑️ Delete</button>
            </div>
          </div>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          <div class="admins-container">
            ${adminsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdowns
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        const adminOption = document.createElement("option");
        adminOption.value = name;
        adminOption.textContent = name;
        adminActivitySelect.appendChild(adminOption);
      });

      // Add event listeners to delete participant buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to edit activity buttons
      document.querySelectorAll(".edit-activity-btn").forEach((button) => {
        button.addEventListener("click", handleEditActivity);
      });

      // Add event listeners to delete activity buttons
      document.querySelectorAll(".delete-activity-btn").forEach((button) => {
        button.addEventListener("click", handleDeleteActivity);
      });

      // Add event listeners to remove admin buttons
      document.querySelectorAll(".remove-admin-btn").forEach((button) => {
        button.addEventListener("click", handleRemoveAdmin);
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
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => { messageDiv.classList.add("hidden"); }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle edit activity button click (populate form)
  async function handleEditActivity(event) {
    const activityName = event.target.getAttribute("data-activity");
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      const details = activities[activityName];
      editActivityNameInput.value = activityName;
      document.getElementById("new-activity-name").value = activityName;
      document.getElementById("new-activity-name").disabled = true;
      document.getElementById("new-activity-description").value = details.description;
      document.getElementById("new-activity-schedule").value = details.schedule;
      document.getElementById("new-activity-max").value = details.max_participants;
      activityFormTitle.textContent = "Edit Activity";
      activityFormSubmit.textContent = "Save Changes";
      addActivityForm.classList.remove("hidden");
      showAddActivityBtn.classList.add("hidden");
      addActivityForm.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error loading activity for edit:", error);
    }
  }

  // Handle delete activity
  async function handleDeleteActivity(event) {
    const activityName = event.target.getAttribute("data-activity");
    if (!confirm(`Are you sure you want to delete "${activityName}"?`)) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (response.ok) {
        showAdminMessage(result.message, "success");
        fetchActivities();
      } else {
        showAdminMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showAdminMessage("Failed to delete activity. Please try again.", "error");
      console.error("Error deleting activity:", error);
    }
  }

  // Handle add/edit activity form submission
  addActivityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const originalName = editActivityNameInput.value;
    const name = document.getElementById("new-activity-name").value.trim();
    const description = document.getElementById("new-activity-description").value.trim();
    const schedule = document.getElementById("new-activity-schedule").value.trim();
    const maxParticipants = parseInt(document.getElementById("new-activity-max").value, 10);

    const body = JSON.stringify({ description, schedule, max_participants: maxParticipants });
    const isEdit = !!originalName;

    try {
      let response;
      if (isEdit) {
        response = await fetch(
          `/activities/${encodeURIComponent(originalName)}`,
          { method: "PUT", headers: { "Content-Type": "application/json" }, body }
        );
      } else {
        response = await fetch(
          `/activities?name=${encodeURIComponent(name)}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body }
        );
      }
      const result = await response.json();
      if (response.ok) {
        showAdminMessage(result.message, "success");
        addActivityForm.classList.add("hidden");
        showAddActivityBtn.classList.remove("hidden");
        fetchActivities();
      } else {
        showAdminMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showAdminMessage("Failed to save activity. Please try again.", "error");
      console.error("Error saving activity:", error);
    }
  });

  // Handle assign admin form submission
  assignAdminForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("admin-email").value.trim();
    const activityName = document.getElementById("admin-activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/assign-admin?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        showAdminMessage(result.message, "success");
        assignAdminForm.reset();
        fetchActivities();
      } else {
        showAdminMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showAdminMessage("Failed to assign admin. Please try again.", "error");
      console.error("Error assigning admin:", error);
    }
  });

  // Handle remove admin
  async function handleRemoveAdmin(event) {
    const button = event.target;
    const activityName = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/remove-admin?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (response.ok) {
        showAdminMessage(result.message, "success");
        fetchActivities();
      } else {
        showAdminMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showAdminMessage("Failed to remove admin. Please try again.", "error");
      console.error("Error removing admin:", error);
    }
  }

  function showAdminMessage(text, type) {
    adminMessageDiv.textContent = text;
    adminMessageDiv.className = type;
    adminMessageDiv.classList.remove("hidden");
    setTimeout(() => { adminMessageDiv.classList.add("hidden"); }, 5000);
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
});
