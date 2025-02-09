const API_KEY = '942ec9f32f47ec7759f0828a97dec2c3';
const API_BASE_URL = 'https://api.adzuna.com/v1/api/jobs/gb/search/1?app_id=2ba99f8a&app_key=942ec9f32f47ec7759f0828a97dec2c3';

// Initialize state
let jobs = JSON.parse(localStorage.getItem('jobs')) || [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    loadJobs();
    updateStatistics();

    // Add new event listeners
    document.getElementById('openAddJobBtn').addEventListener('click', openAddJobDialog);
    document.getElementById('openSearchJobsBtn').addEventListener('click', openSearchDialog);
    document.getElementById('searchJobsBtn').addEventListener('click', handleApiSearch);
});

function initializeApp() {
    // Add job form submission
    const addJobForm = document.getElementById('addJobForm');
    addJobForm.addEventListener('submit', handleAddJob);

    // Initialize filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.status;
            loadJobs();
        });
    });

    // Initialize search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        loadJobs();
    });
}

function handleAddJob(e) {
    e.preventDefault();

    const newJob = {
        id: Date.now().toString(),
        companyName: document.getElementById('companyName').value,
        jobTitle: document.getElementById('jobTitle').value,
        location: document.getElementById('location').value,
        salary: document.getElementById('salary').value,
        applicationDate: document.getElementById('applicationDate').value,
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value
    };

    jobs.push(newJob);
    saveJobs();
    loadJobs();
    updateStatistics();
    showToast('Job application added successfully!', 'success');
    e.target.reset();
    closeAddJobDialog();
}

function createJobCard(job) {
    const statusColors = {
        applied: 'status-applied',
        interview: 'status-interview',
        offer: 'status-offer',
        rejected: 'status-rejected'
    };

    return `
        <div class="job-card" data-id="${job.id}" style="padding: 15px;">
            <span class="job-status ${statusColors[job.status]}">
                ${job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            <h3 class="job-company">${job.companyName}</h3>
            <div class="job-position">${job.jobTitle}</div>
            <div class="job-details">
                <div><i class="fas fa-map-marker-alt"></i>${job.location}</div>
                ${job.salary ? `<div><i class="fas fa-money-bill-alt"></i>${job.salary}</div>` : ''}
                <div><i class="fas fa-calendar"></i>${formatDate(job.applicationDate)}</div>
            </div>
            ${job.notes ? `<div class="job-notes"><i class="fas fa-sticky-note"></i>${job.notes}</div>` : ''}
            <div class="job-actions">
                <button class="btn btn-primary" onclick="editStatus('${job.id}')">
                    <i class="fas fa-edit"></i> Update Status
                </button>
                <button class="btn btn-danger" onclick="deleteJob('${job.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function loadJobs() {
    const jobsContainer = document.getElementById('jobsContainer');
    let filteredJobs = jobs;

    // Apply status filter
    if (currentFilter !== 'all') {
        filteredJobs = filteredJobs.filter(job => job.status === currentFilter);
    }

    // Apply search filter
    if (searchQuery) {
        filteredJobs = filteredJobs.filter(job => 
            job.companyName.toLowerCase().includes(searchQuery) ||
            job.jobTitle.toLowerCase().includes(searchQuery) ||
            job.location.toLowerCase().includes(searchQuery)
        );
    }

    if (filteredJobs.length === 0) {
        jobsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open fa-3x"></i>
                <p>${searchQuery || currentFilter !== 'all' ? 'No matching applications found.' : 'No applications yet. Start by adding your first job application!'}</p>
            </div>
        `;
        return;
    }

    jobsContainer.innerHTML = filteredJobs
        .sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate))
        .map(createJobCard)
        .join('');
}

async function searchJobs(query) {
    try {
        const response = await fetch(`${API_BASE_URL}&what=${encodeURIComponent(query)}`);
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error('Error fetching jobs:', error);
        showToast('Error fetching job listings', 'error');
        return [];
    }
}

function editStatus(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    const newStatus = prompt('Update status (applied/interview/offer/rejected):', job.status);
    if (newStatus && ['applied', 'interview', 'offer', 'rejected'].includes(newStatus.toLowerCase())) {
        job.status = newStatus.toLowerCase();
        saveJobs();
        loadJobs();
        updateStatistics();
        showToast('Job status updated successfully!', 'success');
    } else if (newStatus) {
        showToast('Invalid status. Please try again.', 'error');
    }
}

function deleteJob(jobId) {
    if (confirm('Are you sure you want to delete this job application?')) {
        jobs = jobs.filter(job => job.id !== jobId);
        saveJobs();
        loadJobs();
        updateStatistics();
        showToast('Job application deleted successfully!', 'success');
    }
}

function updateStatistics() {
    const totalApplications = jobs.length;
    const offers = jobs.filter(job => job.status === 'offer').length;
    const pending = jobs.filter(job => job.status !== 'rejected' && job.status !== 'offer').length;
    const interviews = jobs.filter(job => job.status === 'interview').length;
    
    document.getElementById('totalApplications').textContent = totalApplications;
    document.getElementById('successRate').textContent = totalApplications ? 
        `${((offers / totalApplications) * 100).toFixed(1)}%` : '0%';
    document.getElementById('pendingResponses').textContent = pending;
    document.getElementById('upcomingInterviews').textContent = interviews;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function saveJobs() {
    localStorage.setItem('jobs', JSON.stringify(jobs));
}

function openAddJobDialog() {
    const dialog = document.getElementById('addJobDialog');
    dialog.showModal();
}

function closeAddJobDialog() {
    const dialog = document.getElementById('addJobDialog');
    dialog.close();
}

function openSearchDialog() {
    const dialog = document.getElementById('searchJobsDialog');
    dialog.showModal();
}

function closeSearchDialog() {
    const dialog = document.getElementById('searchJobsDialog');
    dialog.close();
}

async function handleApiSearch() {
    const searchQuery = document.getElementById('apiSearchInput').value;
    const resultsContainer = document.getElementById('apiJobResults');
    resultsContainer.innerHTML = '<p>Searching...</p>';

    try {
        const jobs = await searchJobs(searchQuery);
        if (jobs.length === 0) {
            resultsContainer.innerHTML = '<p>No jobs found</p>';
            return;
        }

        resultsContainer.innerHTML = jobs.map(job => `
            <div class="job-card">
                <h3 class="job-company">${job.company.display_name}</h3>
                <div class="job-position">${job.title}</div>
                <div class="job-details">
                    <div><i class="fas fa-map-marker-alt"></i>${job.location.display_name}</div>
                    ${job.salary_min ? `<div><i class="fas fa-money-bill-alt"></i>£${job.salary_min} - £${job.salary_max}</div>` : ''}
                </div>
                <button class="btn btn-primary" onclick="addJobFromApi(${JSON.stringify(job).replace(/"/g, '&quot;')})">
                    <i class="fas fa-plus"></i> Add to Applications
                </button>
            </div>
        `).join('');
    } catch (error) {
        resultsContainer.innerHTML = '<p>Error fetching jobs. Please try again.</p>';
    }
}

function addJobFromApi(job) {
    document.getElementById('companyName').value = job.company.display_name;
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('location').value = job.location.display_name;
    document.getElementById('salary').value = job.salary_min ? `£${job.salary_min} - £${job.salary_max}` : '';
    document.getElementById('applicationDate').value = new Date().toISOString().split('T')[0];
    
    closeSearchDialog();
    openAddJobDialog();
}