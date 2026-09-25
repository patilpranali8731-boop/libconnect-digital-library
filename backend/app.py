from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import os
import uuid 
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

CORS(app)

# ==========================================
# PDF UPLOAD CONFIGURATION
# ==========================================

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "uploads",
    "pdfs"
)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

ALLOWED_EXTENSIONS = {"pdf"}


def allowed_file(filename):

    return (
        "." in filename
        and
        filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# =====================================================
# MYSQL DATABASE CONNECTION
# =====================================================

def get_db_connection():

    connection = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)
    return connection

# ==========================================
# VIEW PDF FILE
# ==========================================

from flask import send_from_directory

@app.route("/api/resources/pdf/<filename>")
def view_pdf(filename):

    try:

        return send_from_directory(
            app.config["UPLOAD_FOLDER"],
            filename
        )

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 404


# =====================================================
# HOME
# =====================================================

@app.route("/")
def home():

    return jsonify({
        "message": "LibConnect Backend is running successfully!"
    })


# =====================================================
# DATABASE TEST
# =====================================================

@app.route("/api/db-test")
def database_test():

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor()

        cursor.execute("SELECT DATABASE();")

        database = cursor.fetchone()

        return jsonify({
            "status": "success",
            "database": database[0],
            "message": "MySQL connection successful!"
        })

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# GET ALL RESOURCES
# =====================================================

@app.route("/api/resources")
def get_resources():

    connection = None
    cursor = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)

        query = """
            SELECT
                resources.id,
                resources.title,
                resources.author,
                categories.name AS category,
                resources.language,
                resources.publication_year,
                resources.resource_type,
                resources.description,
                resources.file_path,
                resources.cover_image,
                resources.status,
                resources.created_at
            FROM resources
            JOIN categories
            ON resources.category_id = categories.id
            WHERE resources.status = 'active'
            ORDER BY resources.id DESC
        """

        cursor.execute(query)

        resources = cursor.fetchall()

        return jsonify({
            "status": "success",
            "count": len(resources),
            "resources": resources
        })

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# STEP 15 - USER REGISTRATION
# =====================================================

@app.route("/api/register", methods=["POST"])
def register_user():

    connection = None
    cursor = None

    try:

        data = request.get_json()

        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")
        community_centre = data.get("community_centre")


        if not full_name or not email or not password:

            return jsonify({
                "status": "error",
                "message": "Please fill all required fields."
            }), 400


        connection = get_db_connection()

        cursor = connection.cursor()


        # Check existing email

        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()


        if existing_user:

            return jsonify({
                "status": "error",
                "message": "Email already registered."
            }), 409


        # Public registration = MEMBER

        cursor.execute(
            """
            INSERT INTO users
            (
                full_name,
                email,
                password,
                role,
                community_centre
            )
            VALUES
            (
                %s,
                %s,
                %s,
                'member',
                %s
            )
            """,
            (
                full_name,
                email,
                password,
                community_centre
            )
        )

        connection.commit()


        return jsonify({
            "status": "success",
            "message": "Registration successful!"
        }), 201


    except Exception as error:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()

# =====================================================
# STEP 16 - USER LOGIN
# =====================================================

@app.route("/api/login", methods=["POST"])
def login_user():

    connection = None
    cursor = None

    try:

        data = request.get_json()

        email = data.get("email")
        password = data.get("password")


        if not email or not password:

            return jsonify({
                "status": "error",
                "message": "Email and password are required."
            }), 400


        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)


        cursor.execute(
            """
            SELECT
                id,
                full_name,
                email,
                password,
                role,
                community_centre
            FROM users
            WHERE email = %s
            """,
            (email,)
        )


        user = cursor.fetchone()


        if not user:

            return jsonify({
                "status": "error",
                "message": "Invalid email or password."
            }), 401


        if user["password"] != password:

            return jsonify({
                "status": "error",
                "message": "Invalid email or password."
            }), 401


        return jsonify({

            "status": "success",

            "message": "Login successful!",

            "user": {

                "id": user["id"],

                "full_name": user["full_name"],

                "email": user["email"],

                "role": user["role"],

                "community_centre":
                    user["community_centre"]

            }

        }), 200


    except Exception as error:

        return jsonify({

            "status": "error",

            "message": str(error)

        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# =====================================================
# STEP 17 - CREATE LIBRARIAN
# =====================================================

@app.route(
    "/api/admin/create-librarian",
    methods=["POST"]
)
def create_librarian():

    connection = None
    cursor = None

    try:

        data = request.get_json()


        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")
        community_centre = data.get("community_centre")


        # =========================
        # VALIDATION
        # =========================

        if (
            not full_name
            or not email
            or not password
            or not community_centre
        ):

            return jsonify({

                "status": "error",

                "message":
                    "Please fill all required fields."

            }), 400


        # =========================
        # DATABASE CONNECTION
        # =========================

        connection = get_db_connection()

        cursor = connection.cursor()


        # =========================
        # CHECK EMAIL
        # =========================

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
            """,
            (email,)
        )


        existing_user = cursor.fetchone()


        if existing_user:

            return jsonify({

                "status": "error",

                "message":
                    "Email is already registered."

            }), 409


        # =========================
        # INSERT LIBRARIAN
        # =========================

        cursor.execute(
            """
            INSERT INTO users
            (
                full_name,
                email,
                password,
                role,
                community_centre
            )
            VALUES
            (
                %s,
                %s,
                %s,
                'librarian',
                %s
            )
            """,
            (
                full_name,
                email,
                password,
                community_centre
            )
        )


        # =========================
        # SAVE
        # =========================

        connection.commit()


        # =========================
        # RETURN SUCCESS
        # =========================

        return jsonify({

            "status": "success",

            "message":
                "Librarian account created successfully."

        }), 201


    except Exception as error:

        if connection:

            connection.rollback()


        print(
            "CREATE LIBRARIAN ERROR:",
            error
        )


        return jsonify({

            "status": "error",

            "message":
                str(error)

        }), 500


    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()

@app.route("/api/admin/stats")
def admin_stats():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM users WHERE role = 'member') AS members,
                (SELECT COUNT(*) FROM users WHERE role = 'librarian') AS librarians,
                (SELECT COUNT(*) FROM resources) AS resources
        """)

        stats = cursor.fetchone()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "stats": stats
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

@app.route("/api/resources", methods=["POST"])
def add_resource():

    connection = None
    cursor = None

    try:

        # ==========================================
        # GET RESOURCE DETAILS
        # ==========================================

        title = request.form.get("title")
        author = request.form.get("author")
        category = request.form.get("category")
        language = request.form.get("language")
        publication_year = request.form.get("publication_year")
        resource_type = request.form.get("resource_type")
        description = request.form.get("description")

        # ==========================================
        # CHECK REQUIRED FIELDS
        # ==========================================

        if not title or not category or not language or not resource_type:

            return jsonify({
                "status": "error",
                "message": "Please fill all required fields."
            }), 400

        # ==========================================
        # GET PDF FILE
        # ==========================================

        pdf_file = request.files.get("pdf")

        if not pdf_file:

            return jsonify({
                "status": "error",
                "message": "Please select a PDF file."
            }), 400

        if pdf_file.filename == "":

            return jsonify({
                "status": "error",
                "message": "Please select a PDF file."
            }), 400

        # ==========================================
        # CHECK FILE TYPE
        # ==========================================

        if not allowed_file(pdf_file.filename):

            return jsonify({
                "status": "error",
                "message": "Only PDF files are allowed."
            }), 400

        # ==========================================
        # CREATE UNIQUE FILE NAME
        # ==========================================

        original_filename = secure_filename(
            pdf_file.filename
        )

        unique_filename = (
            str(uuid.uuid4())
            + "_"
            + original_filename
        )

        file_path = os.path.join(
            app.config["UPLOAD_FOLDER"],
            unique_filename
        )

        # ==========================================
        # SAVE PDF
        # ==========================================

        pdf_file.save(file_path)

        # ==========================================
        # DATABASE CONNECTION
        # ==========================================

        connection = get_db_connection()
        cursor = connection.cursor()

        # ==========================================
        # FIND CATEGORY
        # ==========================================

        cursor.execute(
            "SELECT id FROM categories WHERE name = %s",
            (category,)
        )

        category_result = cursor.fetchone()

        if not category_result:

            return jsonify({
                "status": "error",
                "message": "Category not found."
            }), 400

        category_id = category_result[0]

        # ==========================================
        # SAVE RESOURCE IN DATABASE
        # ==========================================

        cursor.execute(
            """
            INSERT INTO resources
            (
                title,
                author,
                category_id,
                language,
                publication_year,
                resource_type,
                description,
                file_path,
                status
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                'active'
            )
            """,
            (
                title,
                author,
                category_id,
                language,
                publication_year,
                resource_type,
                description,
                unique_filename
            )
        )

        connection.commit()

        return jsonify({
            "status": "success",
            "message": "Resource and PDF uploaded successfully."
        }), 201

    except Exception as error:

        if connection:
            connection.rollback()

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()

@app.route("/api/resources/<int:resource_id>", methods=["DELETE"])
def delete_resource(resource_id):
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "DELETE FROM resources WHERE id = %s",
            (resource_id,)
        )

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Resource not found."
            }), 404

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Resource deleted successfully."
        })

    except Exception as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

@app.route("/api/resources/<int:resource_id>", methods=["PUT"])
def edit_resource(resource_id):

    try:
        data = request.get_json()

        title = data.get("title")
        author = data.get("author")
        category = data.get("category")
        language = data.get("language")
        publication_year = data.get("publication_year")
        resource_type = data.get("resource_type")
        description = data.get("description")

        if not title or not category or not language or not resource_type:
            return jsonify({
                "status": "error",
                "message": "Please fill all required fields."
            }), 400

        connection = get_db_connection()
        cursor = connection.cursor()

        # Find category ID
        cursor.execute(
            "SELECT id FROM categories WHERE name = %s",
            (category,)
        )

        category_result = cursor.fetchone()

        if not category_result:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Category not found."
            }), 400

        category_id = category_result[0]

        # Update resource
        cursor.execute(
            """
            UPDATE resources
            SET
                title = %s,
                author = %s,
                category_id = %s,
                language = %s,
                publication_year = %s,
                resource_type = %s,
                description = %s
            WHERE id = %s
            """,
            (
                title,
                author,
                category_id,
                language,
                publication_year,
                resource_type,
                description,
                resource_id
            )
        )

        if cursor.rowcount == 0:
            cursor.close()
            connection.close()

            return jsonify({
                "status": "error",
                "message": "Resource not found."
            }), 404

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "status": "success",
            "message": "Resource updated successfully."
        })

    except Exception as error:

        return jsonify({
            "status": "error",
            "message": str(error)
        }), 500

# =====================================================
# RUN SERVER
# =====================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )