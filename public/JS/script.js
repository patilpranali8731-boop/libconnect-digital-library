/* =====================================================
   LIBCONNECT JAVASCRIPT
===================================================== */


/* =====================================================
   STEP 1 - HOME PAGE SEARCH
===================================================== */

function filterLibrary() {

    const resourceGrid =
        document.getElementById("resourceGrid");

    const noResults =
        document.getElementById("noResults");

    const searchInput =
        document.getElementById("librarySearch");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const languageFilter =
        document.getElementById("languageFilter");

    const typeFilter =
        document.getElementById("typeFilter");

    if (!resourceGrid) {
        return;
    }


    const searchText =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

    const selectedCategory =
        categoryFilter
            ? categoryFilter.value.toLowerCase().trim()
            : "all";

    const selectedLanguage =
        languageFilter
            ? languageFilter.value.toLowerCase().trim()
            : "all";

    const selectedType =
        typeFilter
            ? typeFilter.value.toLowerCase().trim()
            : "all";


    /* ================= FILTER RESOURCES ================= */

    const filteredResources =
        databaseResources.filter(function(resource) {

            const title =
                String(resource.title || "")
                    .toLowerCase();

            const author =
                String(resource.author || "")
                    .toLowerCase();

            const description =
                String(resource.description || "")
                    .toLowerCase();

            const category =
                String(resource.category || "")
                    .toLowerCase()
                    .trim();

            const language =
                String(resource.language || "")
                    .toLowerCase()
                    .trim();

            const type =
                String(resource.resource_type || "")
                    .toLowerCase()
                    .trim();


            /* ================= SEARCH ================= */

            const matchesSearch =
                searchText === "" ||
                title.includes(searchText) ||
                author.includes(searchText) ||
                description.includes(searchText);


            /* ================= CATEGORY ================= */

            let matchesCategory = true;

            if (selectedCategory !== "all") {

                if (selectedCategory === "career") {

                    matchesCategory =
                        category === "career" ||
                        category === "career & jobs";

                } else if (selectedCategory === "competitive") {

                    matchesCategory =
                        category === "competitive" ||
                        category === "competitive exams";

                } else {

                    matchesCategory =
                        category === selectedCategory;

                }

            }


            /* ================= LANGUAGE ================= */

            let matchesLanguage = true;

            if (selectedLanguage !== "all") {

                matchesLanguage =
                    language === selectedLanguage;

            }


            /* ================= RESOURCE TYPE ================= */

            let matchesType = true;

            if (selectedType !== "all") {

                if (selectedType === "ebook") {

                    matchesType =
                        type === "ebook" ||
                        type === "e-book";

                } else if (selectedType === "notes") {

                    matchesType =
                        type === "notes" ||
                        type === "study notes";

                } else {

                    matchesType =
                        type === selectedType;

                }

            }


            return (
                matchesSearch &&
                matchesCategory &&
                matchesLanguage &&
                matchesType
            );

        });


    /* ================= DISPLAY ================= */

    resourceGrid.innerHTML = "";


    filteredResources.forEach(function(resource) {

        const card =
            document.createElement("div");

        card.className =
            "resource-card";


        card.innerHTML = `

            <div class="resource-card-content">

                <div class="resource-card-cover">
                    📚
                </div>

                <span class="resource-category">
                    ${resource.category || "General"}
                </span>

                <h3>
                    ${resource.title || "Untitled Resource"}
                </h3>

                <p>
                    By ${resource.author || "Unknown"}
                </p>

                <p>
                    ${resource.description || "Digital learning resource."}
                </p>

                <div class="resource-meta">

                    <span>
                        🌐 ${resource.language || "N/A"}
                    </span>

                    <span>
                        📄 ${resource.resource_type || "N/A"}
                    </span>

                    <span>
                        📅 ${resource.publication_year || "N/A"}
                    </span>

                </div>

                <div class="resource-actions">

                    <a
                        href="book-details.html?id=${resource.id}"
                        class="btn"
                    >
                        Read
                    </a>

                </div>

            </div>

        `;

        resourceGrid.appendChild(card);

    });


    /* ================= RESOURCE COUNT ================= */

    const resourceCount =
        document.getElementById(
            "libraryResourceCount"
        );

    if (resourceCount) {

        resourceCount.textContent =
            filteredResources.length +
            (
                filteredResources.length === 1
                    ? " Resource"
                    : " Resources"
            );

    }


    /* ================= NO RESULTS ================= */

    if (noResults) {

        noResults.style.display =
            filteredResources.length === 0
                ? "block"
                : "none";

    }

}

/* =====================================================
   READ RESOURCE
===================================================== */

function readResource(event, resourceName) {

    event.preventDefault();

    alert(
        "Opening:\n\n" +
        resourceName +
        "\n\nPDF reader functionality will be connected in Step 4."
    );
}


/* =====================================================
   DOWNLOAD RESOURCE
===================================================== */

function downloadResource(event, resourceName) {

    event.preventDefault();

    alert(
        "Download requested:\n\n" +
        resourceName +
        "\n\nActual PDF download will be connected with Flask later."
    );
}


/* =====================================================
   BOOKMARK RESOURCE
===================================================== */

function bookmarkResource(button) {

    button.classList.toggle("bookmarked");

    if (button.classList.contains("bookmarked")) {

        button.innerHTML = "♥️";

    } else {

        button.innerHTML = "♡";

    }
}


/* =====================================================
   STEP 4 - BOOK DETAILS & PDF READER
===================================================== */


/* ================= OPEN PDF READER ================= */

async function openPDFReader() {

    const pdfReaderSection =
        document.getElementById("pdfReaderSection");

    const pdfFrame =
        document.getElementById("pdfFrame");

    const readerTitle =
        document.getElementById("readerTitle");

    if (!pdfReaderSection || !pdfFrame) {
        return;
    }

    // Get resource ID from URL
    const urlParams =
        new URLSearchParams(window.location.search);

    const resourceId =
        urlParams.get("id");

    if (!resourceId) {

        alert("Resource ID not found.");
        return;

    }

    try {

        // Get all resources directly from backend
        const response =
            await fetch(
                "/api/resources"
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load resources."
            );

        }

        const data =
            await response.json();

        const resources =
            data.resources || [];

        // Find the selected resource
        const resource =
            resources.find(
                function(item) {

                    return String(item.id) ===
                           String(resourceId);

                }
            );

        if (!resource) {

            alert(
                "Resource with ID " +
                resourceId +
                " was not found."
            );

            return;

        }

        console.log(
            "Selected resource:",
            resource
        );

        // Check whether PDF exists
        if (!resource.file_path) {

            alert(
                "This resource does not have a PDF file."
            );

            return;

        }

        // Set title
        if (readerTitle) {

            readerTitle.textContent =
                resource.title ||
                "PDF Reader";

        }

        // Create actual PDF URL
        const pdfUrl =
            "/api/resources/pdf/" +
            encodeURIComponent(
                resource.file_path
            );

        console.log(
            "PDF URL:",
            pdfUrl
        );

        // Display actual PDF
        pdfFrame.src = pdfUrl;

        // Show reader
        pdfReaderSection.style.display =
            "block";

        // Scroll to reader
        pdfReaderSection.scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {

        console.error(
            "PDF reader error:",
            error
        );

        alert(
            "Unable to load the PDF."
        );

    }
}

/* ================= CLOSE PDF READER ================= */

function closePDFReader() {

    const pdfReader =
        document.getElementById("pdfReaderSection");

    if (!pdfReader) {
        return;
    }

    pdfReader.style.display = "none";
}


/* ================= DOWNLOAD BOOK ================= */

function downloadBook() {

    alert(
        "Download requested.\n\n" +
        "The actual PDF download will be connected " +
        "to the Flask backend later."
    );
}


/* ================= BOOKMARK DETAILS ================= */

function toggleDetailsBookmark() {

    const bookmark =
        document.getElementById("detailsBookmark");

    if (!bookmark) {
        return;
    }

    bookmark.classList.toggle("bookmarked");

    if (bookmark.classList.contains("bookmarked")) {

        bookmark.innerHTML =
            "♥️ Bookmarked";

    } else {

        bookmark.innerHTML =
            "♡ Bookmark";

    }
}


/* =====================================================
   STEP 5 - MEMBER DASHBOARD
===================================================== */


/* ================= LOGOUT ================= */

function logoutUser() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );

    if (confirmLogout) {

        localStorage.removeItem("libconnectUser");

        window.location.href =
            "login.html";
    }
}


/* =====================================================
   STEP 6 - LIBRARIAN DASHBOARD
===================================================== */


/* ================= OPEN ADD RESOURCE ================= */

function openAddResource() {

    const modal =
        document.getElementById("addResourceModal");

    if (modal) {
        modal.style.display = "block";
    }
}


/* ================= CLOSE ADD RESOURCE ================= */

function closeAddResource() {

    const modal =
        document.getElementById("addResourceModal");

    if (modal) {
        modal.style.display = "none";
    }
}


/* ================= UPLOAD RESOURCE ================= */

function openUploadResource() {

    openAddResource();
}


/* ================= MANAGE RESOURCES ================= */

function scrollToResources() {

    const resources =
        document.getElementById("resources");

    if (resources) {

        resources.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
}


/* ================= EDIT RESOURCE ================= */

async function editResource(resourceId) {

    const title = prompt("Enter new resource title:");

    if (title === null || title.trim() === "") {
        return;
    }

    const author = prompt("Enter author:");

    if (author === null) {
        return;
    }

    const category = prompt(
        "Enter category:\nEducation\nTechnology\nCybersecurity\nCareer & Jobs\nCompetitive Exams\nAgriculture\nNews & Magazines\nChildren's Books"
    );

    if (category === null || category.trim() === "") {
        return;
    }

    const language = prompt("Enter language:");

    if (language === null || language.trim() === "") {
        return;
    }

    const publicationYear = prompt(
        "Enter publication year:"
    );

    const resourceType = prompt(
        "Enter resource type (PDF / E-Book / Notes / Magazine):"
    );

    if (
        resourceType === null ||
        resourceType.trim() === ""
    ) {
        return;
    }

    const description = prompt(
        "Enter description:"
    );

    try {

        const response = await fetch(
            `/api/resources/${resourceId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title.trim(),
                    author: author.trim(),
                    category: category.trim(),
                    language: language.trim(),
                    publication_year: publicationYear,
                    resource_type: resourceType.trim(),
                    description: description || ""
                })
            }
        );

        const data = await response.json();

        if (data.status === "success") {

            alert("Resource updated successfully!");

            loadLibrarianResources();
            loadLibrarianStats();

        } else {

            alert(data.message);
        }

    } catch (error) {

        console.error(
            "Edit resource error:",
            error
        );

        alert(
            "Unable to connect to the server."
        );
    }
}

/* ================= DELETE RESOURCE ================= */
async function deleteResource(resourceId) {

    const confirmation = confirm(
        "Are you sure you want to delete this resource?"
    );

    if (!confirmation) {
        return;
    }

    try {

        const response = await fetch(
            `/api/resources/${resourceId}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (data.status === "success") {

            alert("Resource deleted successfully!");

            loadLibrarianResources();
            loadLibrarianStats();

        } else {

            alert(data.message);
        }

    } catch (error) {

        console.error(
            "Delete resource error:",
            error
        );

        alert(
            "Unable to connect to the server.\n\n" +
            "Please make sure Flask is running."
        );
    }
}


/* ================= SEARCH LIBRARIAN RESOURCES ================= */

function filterLibrarianResources() {

    const searchInput =
        document.getElementById("librarianSearch");

    const categorySelect =
        document.getElementById("librarianCategory");

    if (!searchInput || !categorySelect) {
        return;
    }

    const searchValue =
        searchInput.value.toLowerCase().trim();

    const categoryValue =
        categorySelect.value.toLowerCase();

    const rows =
        document.querySelectorAll(
            "#resourceTableBody tr"
        );

    rows.forEach(function(row) {

        const rowText =
            row.innerText.toLowerCase();

        const matchesSearch =
            searchValue === "" ||
            rowText.includes(searchValue);

        const matchesCategory =
            categoryValue === "all" ||
            rowText.includes(categoryValue);

        if (matchesSearch && matchesCategory) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });
}


/* ================= ADD RESOURCE ================= */

const addResourceForm =
    document.getElementById("addResourceForm");

if (addResourceForm) {

    addResourceForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const title =
                document.getElementById("resourceTitle").value.trim();

            const author =
                document.getElementById("resourceAuthor").value.trim();

            const category =
                document.getElementById("resourceCategory").value;

            const language =
                document.getElementById("resourceLanguage").value;

            const publicationYear =
                document.getElementById("resourceYear").value;

            const resourceType =
                document.getElementById("resourceType").value;

            const description =
                document.getElementById("resourceDescription").value.trim();


            try {

                const response = await fetch(
                    "/api/resources",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            title: title,
                            author: author,
                            category: category,
                            language: language,
                            publication_year: publicationYear,
                            resource_type: resourceType,
                            description: description
                        })
                    }
                );


                const data = await response.json();


                if (data.status === "success") {

                    alert(
                        "Resource added successfully!"
                    );

                    addResourceForm.reset();

                    closeAddResource();

                    loadLibrarianResources();

                    loadLibrarianStats();

                } else {

                    alert(data.message);

                }

            } catch (error) {

                console.error(
                    "Add resource error:",
                    error
                );

                alert(
                    "Unable to connect to the server.\n\n" +
                    "Please make sure Flask is running."
                );
            }

        }
    );
}


/* =====================================================
   STEP 7 - ADMIN DASHBOARD
===================================================== */


/* ================= SCROLL TO ADMIN SECTION ================= */

function scrollToAdminSection(sectionId) {

    const section =
        document.getElementById(sectionId);

    if (section) {

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }
}


/* ================= CREATE LIBRARIAN MODAL ================= */

function openCreateLibrarian() {

    const modal =
        document.getElementById(
            "createLibrarianModal"
        );

    if (modal) {

        modal.style.display = "block";

    }
}


function closeCreateLibrarian() {

    const modal =
        document.getElementById(
            "createLibrarianModal"
        );

    if (modal) {

        modal.style.display = "none";

    }
}


/* ================= VIEW USER ================= */

function viewAdminUser(userName) {

    alert(
        "Member Details\n\n" +
        "Member: " +
        userName +
        "\n\n" +
        "User management will be connected " +
        "to MySQL in the backend stage."
    );
}


/* ================= EDIT LIBRARIAN ================= */

function editLibrarian(librarianName) {

    alert(
        "Edit Librarian\n\n" +
        "Librarian: " +
        librarianName +
        "\n\n" +
        "Editing will be connected to " +
        "MySQL in the backend stage."
    );
}


/* =====================================================
   STEP 8 - COMMUNITY CENTRE & LOCAL KNOWLEDGE
===================================================== */


/* ================= VIEW CENTRE ================= */

function viewCentre(centreName) {

    alert(
        "Community Centre\n\n" +
        "Centre: " +
        centreName +
        "\n\n" +
        "Centre details will be connected to the database later."
    );
}


/* ================= LOCAL KNOWLEDGE ================= */

function openLocalCategory(categoryName) {

    alert(
        "Local Knowledge\n\n" +
        "Category: " +
        categoryName +
        "\n\n" +
        "Local resources will be connected to the database later."
    );
}


/* =====================================================
   STEP 9 - MOBILE NAVIGATION
===================================================== */

function toggleMenu() {

    const nav =
        document.getElementById("mainNav");

    if (nav) {

        nav.classList.toggle(
            "mobile-menu-open"
        );

    }
}


/* =====================================================
   STEP 14 - DATABASE RESOURCES
===================================================== */

let databaseResources = [];


/* ================= LOAD DATABASE RESOURCES ================= */

async function loadLibraryResources() {

    try {

        const response =
            await fetch(
                "/api/resources"
            );

        if (!response.ok) {

            throw new Error(
                "Unable to load resources."
            );

        }

        const data =
            await response.json();

        databaseResources =
            data.resources || [];

        console.log(
            "Resources loaded from database:",
            databaseResources
        );

        // If this is the Digital Library page,
        // display the resources.
        if (
            document.getElementById("resourceGrid")
        ) {

            filterLibrary();

        }

    } catch (error) {

        console.error(
            "Database resource error:",
            error
        );

        // Only filter if the library page exists
        if (
            document.getElementById("resourceGrid")
        ) {

            filterLibrary();

        }

    }
}

/* ================= LOAD LIBRARY WHEN PAGE OPENS ================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        if (
            document.getElementById(
                "resourceGrid"
            )
        ) {

            loadLibraryResources();

        }

    }
);


/* =====================================================
   STEP 15 - USER REGISTRATION
===================================================== */

const registerForm =
    document.getElementById(
        "registerForm"
    );

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const fullName =
                document.getElementById(
                    "fullName"
                ).value.trim();

            const email =
                document.getElementById(
                    "registerEmail"
                ).value.trim();

            const password =
                document.getElementById(
                    "registerPassword"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;

            const communityCentre =
                document.getElementById(
                    "communityCentre"
                ).value;

            const terms =
                document.getElementById(
                    "terms"
                ).checked;


            if (password !== confirmPassword) {

                alert(
                    "Password and Confirm Password do not match."
                );

                return;
            }


            if (!terms) {

                alert(
                    "Please agree to the Terms & Conditions."
                );

                return;
            }


            try {

                const response =
                    await fetch(
                        "/api/register",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                full_name:
                                    fullName,

                                email:
                                    email,

                                password:
                                    password,

                                community_centre:
                                    communityCentre

                            })
                        }
                    );


                const data =
                    await response.json();


                if (
                    data.status ===
                    "success"
                ) {

                    alert(
                        "Registration successful!"
                    );

                    window.location.href =
                        "login.html";

                } else {

                    alert(
                        data.message
                    );

                }


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                alert(
                    "Unable to connect to the server.\n\n" +
                    "Please make sure Flask is running."
                );

            }

        }
    );

}


/* =====================================================
   STEP 16 - USER LOGIN
===================================================== */

const loginForm =
    document.getElementById(
        "loginForm"
    );

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            const email =
                document.getElementById(
                    "loginEmail"
                ).value.trim();

            const password =
                document.getElementById(
                    "loginPassword"
                ).value;


            if (!email || !password) {

                alert(
                    "Please enter your email and password."
                );

                return;
            }


            try {

                const response =
                    await fetch(
                        "/api/login",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                email:
                                    email,

                                password:
                                    password

                            })
                        }
                    );


                const data =
                    await response.json();


                if (
                    data.status ===
                    "success"
                ) {

                    alert(
                        "Login successful!"
                    );


                    const user =
                        data.user;


                    localStorage.setItem(
                        "libconnectUser",
                        JSON.stringify(user)
                    );


                    if (
                        user.role ===
                        "admin"
                    ) {

                        window.location.href =
                            "admin-dashboard.html";

                    }

                    else if (
                        user.role ===
                        "librarian"
                    ) {

                        window.location.href =
                            "librarian-dashboard.html";

                    }

                    else {

                        window.location.href =
                            "dashboard.html";

                    }

                }

                else {

                    alert(
                        data.message
                    );

                }


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                alert(
                    "Unable to connect to the server.\n\n" +
                    "Please make sure Flask is running."
                );

            }

        }
    );

}


/* =====================================================
   STEP 17 - CREATE LIBRARIAN ACCOUNT
===================================================== */

const createLibrarianForm =
    document.getElementById(
        "createLibrarianForm"
    );

if (createLibrarianForm) {

    createLibrarianForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const fullName =
                document.getElementById(
                    "librarianName"
                ).value.trim();


            const email =
                document.getElementById(
                    "librarianEmail"
                ).value.trim();


            const password =
                document.getElementById(
                    "librarianPassword"
                ).value;


            const communityCentre =
                document.getElementById(
                    "librarianCentre"
                ).value;


            if (
                !fullName ||
                !email ||
                !password ||
                !communityCentre
            ) {

                alert(
                    "Please fill all fields."
                );

                return;
            }


            try {

                const response =
                    await fetch(
                        "/api/admin/create-librarian",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({

                                full_name:
                                    fullName,

                                email:
                                    email,

                                password:
                                    password,

                                community_centre:
                                    communityCentre

                            })
                        }
                    );


                const data =
                    await response.json();


                if (
                    data.status ===
                    "success"
                ) {

                    alert(
                        "Librarian account created successfully!"
                    );

                    createLibrarianForm.reset();

                    closeCreateLibrarian();

                }

                else {

                    alert(
                        data.message
                    );

                }


            } catch (error) {

                console.error(
                    "Create librarian error:",
                    error
                );

                alert(
                    "Unable to connect to the server.\n\n" +
                    "Please make sure Flask is running."
                );

            }

        }
    );

}

/* ================= ADMIN STATISTICS ================= */

async function loadAdminStats() {

    try {

        const response = await fetch(
            "/api/admin/stats"
        );

        const data = await response.json();

        if (data.status === "success") {

            document.getElementById("totalMembers").textContent =
                data.stats.members;

            document.getElementById("totalLibrarians").textContent =
                data.stats.librarians;

            document.getElementById("totalResources").textContent =
                data.stats.resources;
        }

    } catch (error) {

        console.error(
            "Admin statistics error:",
            error
        );

    }
}


if (document.getElementById("totalMembers")) {
    loadAdminStats();
}

/* ================= LIBRARIAN STATISTICS ================= */

async function loadLibrarianStats() {

    try {

        const response = await fetch(
            "/api/admin/stats"
        );

        const data = await response.json();

        if (data.status === "success") {

            const totalResources =
                document.getElementById(
                    "librarianTotalResources"
                );

            if (totalResources) {

                totalResources.textContent =
                    data.stats.resources;

            }

        }

    } catch (error) {

        console.error(
            "Librarian statistics error:",
            error
        );

    }
}

/* ================= LIBRARIAN RESOURCE TABLE ================= */

async function loadLibrarianResources() {

    try {

        const response = await fetch(
            "/api/resources"
        );

        const data = await response.json();

        if (data.status !== "success") {
            console.error(data.message);
            return;
        }

        const tableBody =
            document.getElementById("resourceTableBody");

        if (!tableBody) {
            return;
        }

        tableBody.innerHTML = "";

        data.resources.forEach(function(resource) {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="table-resource">

                        <div class="table-resource-icon">
                            📚
                        </div>

                        <div>
                            <strong>
                                ${resource.title}
                            </strong>

                            <small>
                                ${resource.publication_year || ""}
                            </small>
                        </div>

                    </div>
                </td>

                <td>
                    ${resource.category}
                </td>

                <td>
                    ${resource.author || "Unknown"}
                </td>

                <td>
                    ${resource.resource_type}
                </td>

                <td>
                    <span class="resource-status active">
                        ${resource.status}
                    </span>
                </td>

                <td>

                    <div class="resource-actions">

                        <button
                            onclick="editResource(${resource.id})"
                            title="Edit">
                            ✏️
                        </button>

                        <button
                            onclick="deleteResource(${resource.id})"
                            title="Delete">
                            🗑️
                        </button>

                    </div>

                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {

        console.error(
            "Librarian resources error:",
            error
        );

    }
}


if (document.getElementById("resourceTableBody")) {
    loadLibrarianResources();
}

if (document.getElementById("librarianTotalResources")) {
    loadLibrarianStats();
}

// ==========================================
// LOAD LIBRARY RESOURCES FROM DATABASE
// ==========================================

async function loadLibraryResources() {

    try {

        const response = await fetch(
            "/api/resources"
        );

        const data = await response.json();

        if (data.status !== "success") {

            console.error(data.message);

            return;
        }

        const resourceGrid =
            document.getElementById("resourceGrid");

        if (!resourceGrid) {
            return;
        }

        // Clear existing resources
        resourceGrid.innerHTML = "";

        // Display database resources
        data.resources.forEach(function(resource) {

            const card =
                document.createElement("div");

            card.className = "resource-card";

            card.setAttribute(
                "data-title",
                resource.title
            );

            card.setAttribute(
                "data-author",
                resource.author || ""
            );

            card.setAttribute(
                "data-category",
                resource.category || ""
            );

            card.setAttribute(
                "data-language",
                resource.language || ""
            );

            card.setAttribute(
                "data-type",
                resource.resource_type || ""
            );


            card.innerHTML = `

                <div class="resource-cover education-cover">

                    <span>📚</span>

                    <small>
                        ${resource.resource_type || "RESOURCE"}
                    </small>

                </div>


                <div class="resource-content">

                    <span class="resource-category">
                        ${resource.category}
                    </span>


                    <h3>
                        ${resource.title}
                    </h3>


                    <p class="resource-author">

                        By
                        ${resource.author || "Unknown Author"}

                    </p>


                    <p class="resource-description">

                        ${resource.description || "No description available."}

                    </p>


                    <div class="resource-info">

                        <span>
                            ${resource.language}
                        </span>

                        <span>
                            ${resource.publication_year || ""}
                        </span>

                    </div>


                    <div class="resource-actions">

                        <a
                            href="book-details.html?id=${resource.id}"
                            class="read-btn">

                            Read

                        </a>


                        <a
                            href="#"
                            class="download-btn"
                            onclick="downloadResource(event, '${resource.title}')">

                            Download

                        </a>


                        <button
                            class="bookmark-btn"
                            onclick="bookmarkResource(this)">

                            ♡

                        </button>

                    </div>

                </div>
            `;


            resourceGrid.appendChild(card);

        });


        // Update resource count
        const resourceCount =
            document.querySelector(".resource-count");

        if (resourceCount) {

            resourceCount.textContent =
                data.resources.length +
                "+ Resources";

        }

    } catch (error) {

        console.error(
            "Library resource loading error:",
            error
        );
    }
}


// Run only on Digital Library page

if (
    document.getElementById("resourceGrid")
) {

    loadLibraryResources();

}

// ==========================================
// LOAD RESOURCES ON BOOK DETAILS PAGE
// ==========================================

if (
    document.getElementById("pdfReaderSection") &&
    new URLSearchParams(window.location.search).get("id")
) {

    loadLibraryResources();

}

/// ==========================================
// LOAD RESOURCE DETAILS
// ==========================================

async function loadResourceDetails() {

    const urlParams =
        new URLSearchParams(window.location.search);

    const resourceId =
        urlParams.get("id");

    if (!resourceId) {
        return;
    }

    try {

        const response = await fetch(
            "/api/resources"
        );

        const data = await response.json();

        if (data.status !== "success") {
            console.error(data.message);
            return;
        }

        const resource =
            data.resources.find(function(item) {

                return String(item.id) == String(resourceId);

            });

        if (!resource) {

            console.error(
                "Resource not found."
            );

            return;
        }

        // Update page title
        document.title =
            resource.title + " | LibConnect";


        // Title
        const title =
            document.getElementById("bookTitle");

        if (title) {

            title.textContent =
                resource.title;
        }


        // Author
        const author =
            document.getElementById("bookAuthor");

        if (author) {

            author.textContent =
                resource.author ||
                "Unknown Author";
        }


        // Category
        const category =
            document.getElementById("bookCategory");

        if (category) {

            category.textContent =
                resource.category;
        }


        // Description
        const description =
            document.getElementById("bookDescription");

        if (description) {

            description.textContent =
                resource.description ||
                "No description available.";
        }


        // Language
        const language =
            document.getElementById("bookLanguage");

        if (language) {

            language.textContent =
                resource.language;
        }


        // Publication Year
        const year =
            document.getElementById("bookYear");

        if (year) {

            year.textContent =
                resource.publication_year || "";
        }


        // Resource Type
        const type =
            document.getElementById("bookType");

        if (type) {

            type.textContent =
                resource.resource_type;
        }


        // PDF Reader Title
        const readerTitle =
            document.getElementById("readerTitle");

        if (readerTitle) {

            readerTitle.textContent =
                resource.title;
        }

    } catch (error) {

        console.error(
            "Resource details error:",
            error
        );
    }
}


// Run only on book details page

if (
    window.location.pathname.includes(
        "book-details.html"
    )
) {

    loadResourceDetails();

}