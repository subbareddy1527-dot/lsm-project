const API = "/api";

/* ==========================
   REGISTER STUDENT
========================== */

async function registerStudent(event) {

    event.preventDefault();

    const form = event.target;

    const data = {
        name: form.name.value,
        email: form.email.value,
        password: form.password.value,
        age: form.age.value,
        school: form.school.value,
        phone: form.phone.value,
        course: form.course.value
    };

    try {

        const response = await fetch(
            `${API}/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        alert(
            "Registration successful! Please login."
        );

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }
}


/* ==========================
   STUDENT LOGIN
========================== */

async function loginStudent(event) {

    event.preventDefault();

    const form = event.target;

    const data = {
        email: form.email.value,
        password: form.password.value
    };

    try {

        const response = await fetch(
            `${API}/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(data)
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        localStorage.setItem(
            "token",
            result.token
        );

        localStorage.setItem(
            "student",
            JSON.stringify(result.user)
        );

        window.location.href =
            "dashboard.html";

    } catch (error) {

        alert(error.message);

    }
}


/* ==========================
   LOGOUT
========================== */

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("student");

    window.location.href = "index.html";
}


/* ==========================
   LOAD DASHBOARD
========================== */

async function loadDashboard() {

    const token =
        localStorage.getItem("token");

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }

    try {

        const response = await fetch(
            `${API}/profile`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            logout();

            return;
        }

        const user =
            await response.json();

        document.getElementById(
            "studentName"
        ).textContent = user.name;

        document.getElementById(
            "studentEmail"
        ).textContent = user.email;

        document.getElementById(
            "studentSchool"
        ).textContent = user.school;

        document.getElementById(
            "studentCourse"
        ).textContent = user.course;

        loadResults();

        loadProgress();

    } catch (error) {

        console.error(error);

    }
}


/* ==========================
   SAVE QUIZ
========================== */

async function saveQuizResult(
    quiz,
    score,
    total
) {

    const token =
        localStorage.getItem("token");

    if (!token) {

        alert(
            "Please login first to save your score."
        );

        return;
    }

    const response = await fetch(
        `${API}/quiz-result`,
        {
            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                Authorization:
                    `Bearer ${token}`

            },

            body: JSON.stringify({

                quiz,
                score,
                total

            })
        }
    );

    const result =
        await response.json();

    return result;
}


/* ==========================
   LOAD QUIZ RESULTS
========================== */

async function loadResults() {

    const token =
        localStorage.getItem("token");

    if (!token) return;

    const response =
        await fetch(
            `${API}/my-results`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

    const results =
        await response.json();

    const box =
        document.getElementById(
            "results"
        );

    if (!box) return;

    box.innerHTML = "";

    if (results.length === 0) {

        box.innerHTML =
            "<p>No quiz results yet.</p>";

        return;
    }

    results.forEach(result => {

        const card =
            document.createElement("div");

        card.className = "card";

        card.innerHTML = `

            <h3>
                ${result.quiz}
            </h3>

            <p>
                Score:
                ${result.score}/${result.total}
            </p>

            <p>
                Percentage:
                ${result.percentage.toFixed(1)}%
            </p>

        `;

        box.appendChild(card);

    });
}


/* ==========================
   UPDATE PROGRESS
========================== */

async function updateProgress(
    course,
    completed
) {

    const token =
        localStorage.getItem("token");

    if (!token) {

        alert("Please login first.");

        return;
    }

    const response =
        await fetch(
            `${API}/progress`,
            {
                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`

                },

                body: JSON.stringify({

                    course,
                    completed

                })
            }
        );

    const result =
        await response.json();

    alert(result.message);
}


/* ==========================
   LOAD PROGRESS
========================== */

async function loadProgress() {

    const token =
        localStorage.getItem("token");

    if (!token) return;

    const response =
        await fetch(
            `${API}/progress`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

    const data =
        await response.json();

    const progressBox =
        document.getElementById(
            "progressList"
        );

    if (!progressBox) return;

    progressBox.innerHTML = "";

    data.forEach(item => {

        const div =
            document.createElement("div");

        div.className = "card";

        div.innerHTML = `

            <h3>
                ${item.course}
            </h3>

            <p>
                ${
                    item.completed
                    ? "✅ Completed"
                    : "🔵 In Progress"
                }
            </p>

        `;

        progressBox.appendChild(div);

    });
}


/* ==========================
   HTML PRACTICE
========================== */

function runHTML() {

    const code =
        document.getElementById(
            "htmlCode"
        ).value;

    document.getElementById(
        "htmlOutput"
    ).srcdoc = code;
}


/* ==========================
   CSS PRACTICE
========================== */

function runCSS() {

    const code =
        document.getElementById(
            "cssCode"
        ).value;

    document.getElementById(
        "cssOutput"
    ).srcdoc = code;
}