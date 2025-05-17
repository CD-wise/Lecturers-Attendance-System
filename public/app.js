// Firebase Configuration
const firebaseConfig = {
    apiKey: "",
    authDomain: "lecturers-attendance-system.firebaseapp.com",
    projectId: "lecturers-attendance-system",
    storageBucket: "lecturers-attendance-system.firebasestorage.app",
    messagingSenderId: "",
    appId: ""
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Authentication Functions
function showDashboard() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';
}

function hideDashboard() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
}

// Login Function
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            showDashboard();
            fetchRecords();
        })
        .catch(error => alert('Login failed: ' + error.message));
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(hideDashboard);
});

// Add Attendance Record
const attendanceForm = document.getElementById('attendanceForm');
attendanceForm.addEventListener('submit', async(e) => {
    e.preventDefault();
    const record = {
        department: document.getElementById('department').value,
        programmeLevel: document.getElementById('programmeLevel').value,
        class: document.getElementById('class').value,
        course: document.getElementById('course').value,
        courseTitle: document.getElementById('courseTitle').value,
        lecturer: document.getElementById('lecturer').value,
        status: document.getElementById('status').value,
        time: document.getElementById('time').value,
        date: document.getElementById('date').value,
        comments: document.getElementById('comments').value,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        classRep: auth.currentUser.email
    };

    try {
        await db.collection('attendance').add(record);
        alert('Record added successfully!');
        fetchRecords();
        attendanceForm.reset();
    } catch (error) {
        alert('Error adding record: ' + error.message);
    }
});

// Fetch Records
async function fetchRecords() {
    const loadingIndicator = document.getElementById('loading');
    const tbody = document.querySelector('#recordsTable tbody');
    tbody.innerHTML = '';

    loadingIndicator.style.display = 'block';

    try {
        const snapshot = await db.collection('attendance').orderBy('timestamp', 'desc').limit(10).get();
        loadingIndicator.style.display = 'none';

        snapshot.forEach(doc => {
            const data = doc.data();
            const row = tbody.insertRow();
            row.insertCell().textContent = data.date;
            row.insertCell().textContent = data.department;
            row.insertCell().textContent = data.programmeLevel;
            row.insertCell().textContent = data.class;
            row.insertCell().textContent = data.course;
            row.insertCell().textContent = data.courseTitle;
            row.insertCell().textContent = data.lecturer;
            row.insertCell().textContent = data.status;
            row.insertCell().textContent = data.time;

            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.className = 'edit-btn';
            editBtn.onclick = () => openEditModal(doc.id, data);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => deleteRecord(doc.id);

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
        });
    } catch (error) {
        loadingIndicator.style.display = 'none';
        alert('Error fetching records: ' + error.message);
    }
}

// Edit Modal Functions
function openEditModal(id, data) {
    document.getElementById('editId').value = id;
    document.getElementById('editDepartment').value = data.department;
    document.getElementById('editProgrammeLevel').value = data.programmeLevel;
    document.getElementById('editClass').value = data.class;
    document.getElementById('editCourse').value = data.course;
    document.getElementById('editCourseTitle').value = data.courseTitle;
    document.getElementById('editLecturer').value = data.lecturer;
    document.getElementById('editStatus').value = data.status;
    document.getElementById('editTime').value = data.time;
    document.getElementById('editDate').value = data.date;
    document.getElementById('editComments').value = data.comments || '';
    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Edit Form Submission
document.getElementById('editForm').addEventListener('submit', async(e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;

    const updatedData = {
        department: document.getElementById('editDepartment').value,
        programmeLevel: document.getElementById('editProgrammeLevel').value,
        class: document.getElementById('editClass').value,
        course: document.getElementById('editCourse').value,
        courseTitle: document.getElementById('editCourseTitle').value,
        lecturer: document.getElementById('editLecturer').value,
        status: document.getElementById('editStatus').value,
        time: document.getElementById('editTime').value,
        date: document.getElementById('editDate').value,
        comments: document.getElementById('editComments').value,
        lastModified: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await db.collection('attendance').doc(id).update(updatedData);
        alert('Record updated successfully!');
        closeModal();
        fetchRecords();
    } catch (error) {
        alert('Error updating record: ' + error.message);
    }
});

// Delete Record
async function deleteRecord(id) {
    if (confirm('Are you sure you want to delete this record?')) {
        try {
            await db.collection('attendance').doc(id).delete();
            alert('Record deleted successfully!');
            fetchRecords();
        } catch (error) {
            alert('Error deleting record: ' + error.message);
        }
    }
}

// Generate Reports Function
async function generateReport(period) {
    // Create and show department selection modal
    const departments = [
        "Computer Science",
        "Medical Laboratory Technology",
        "Science Laboratory Technology",
        "Applied Mathematics and Statistics"
    ];

    const modalHtml = `
        <div id="reportModal" class="modal">
            <div class="modal-content">
                <h2>Generate ${period.charAt(0).toUpperCase() + period.slice(1)} Report</h2>
                <div class="form-group">
                    <label>Select Department</label>
                    <select id="reportDepartment" class="form-control">
                        <option value="">All Departments</option>
                        ${departments.map(dept => `<option value="${dept}">${dept}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Select Programme Level (Optional)</label>
                    <select id="reportLevel" class="form-control">
                        <option value="">All Levels</option>
                        <option value="HND 100">HND 100</option>
                        <option value="HND 200">HND 200</option>
                        <option value="HND 300">HND 300</option>
                        <option value="BTECH 300">BTECH 300</option>
                        <option value="BTECH 400">BTECH 400</option>
                    </select>
                </div>
                <button class="btn" onclick="executeReport('${period}')">Generate Report</button>
                <button class="btn" onclick="closeReportModal()">Cancel</button>
            </div>
        </div>
    `;

    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('reportModal').style.display = 'flex';
}

// Close Report Modal
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    modal.remove();
}

async function executeReport(period) {
    const department = document.getElementById('reportDepartment').value;
    const programmeLevel = document.getElementById('reportLevel').value;
    let startDate = new Date();

    // Calculate start date based on period
    switch (period) {
        case 'weekly':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'monthly':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case 'semester':
            startDate.setMonth(startDate.getMonth() - 4);
            break;
    }

    try {
        // Create a reference to the attendance collection
        let query = db.collection('attendance');

        // Build query conditions
        if (department && programmeLevel) {
            // Filter by both department and programme level
            query = query.where('department', '==', department)
                        .where('programmeLevel', '==', programmeLevel)
                        .where('timestamp', '>=', startDate);
        } else if (department) {
            // Filter by department only
            query = query.where('department', '==', department)
                        .where('timestamp', '>=', startDate);
        } else if (programmeLevel) {
            // Filter by programme level only
            query = query.where('programmeLevel', '==', programmeLevel)
                        .where('timestamp', '>=', startDate);
        } else {
            // No department or programme level filter, just date
            query = query.where('timestamp', '>=', startDate);
        }

        // Execute the query
        const snapshot = await query.get();
        const records = [];

        // Process the results
        snapshot.forEach(doc => {
            const data = doc.data();
            records.push({
                date: data.date || '',
                department: data.department || '',
                programmeLevel: data.programmeLevel || '',
                class: data.class || '',
                course: data.course || '',
                courseTitle: data.courseTitle || '',
                lecturer: data.lecturer || '',
                status: data.status || '',
                time: data.time || '',
                comments: data.comments || ''
            });
        });

        if (records.length === 0) {
            alert('No records found for the selected criteria.');
            return;
        }

        // Generate filename
        const dateStr = new Date().toISOString().split('T')[0];
        let filename = `attendance_${period}`;
        if (department) filename += `_${department.replace(/\s+/g, '_')}`;
        if (programmeLevel) filename += `_${programmeLevel.replace(/\s+/g, '_')}`;
        filename += `_${dateStr}.csv`;

        // Download the CSV
        downloadCSV(records, filename);
        closeReportModal();

    } catch (error) {
        alert('Error generating report: ' + error.message);
        console.error('Report generation error:', error);
    }
}

function downloadCSV(records, filename) {
    // Define CSV headers
    const headers = [
        'Date',
        'Department',
        'Programme Level',
        'Class',
        'Course Code',
        'Course Title',
        'Lecturer',
        'Lecturer Status',
        'Time',
        'Comments'
    ];

    // Transform records into CSV rows
    const rows = records.map(record => [
        record.date,
        record.department,
        record.programmeLevel,
        record.class,
        record.course,
        record.courseTitle,
        record.lecturer,
        record.status,
        record.time,
        record.comments.replace(/,/g, ';') // Replace commas in comments with semicolons
    ]);

    // Create CSV content
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Authentication State Listener
auth.onAuthStateChanged(user => {
    if (user) {
        showDashboard();
        fetchRecords();
    } else {
        hideDashboard();
    }
});
