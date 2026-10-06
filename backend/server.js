import express from "express";

import cors from "cors";

import dotenv from "dotenv";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import { MongoClient, ObjectId } from "mongodb";

import path from "path";

import { fileURLToPath } from "url";


dotenv.config();


const app = express();

const PORT =
    process.env.PORT || 5000;


/* =========================
   PATH
========================= */

const __filename =
    fileURLToPath(import.meta.url);

const __dirname =
    path.dirname(__filename);


/* =========================
   MIDDLEWARE
========================= */

app.use(cors());

app.use(express.json());


/*
Frontend files are served
from ../frontend
*/

app.use(
    express.static(
        path.join(
            __dirname,
            "../frontend"
        )
    )
);


/* =========================
   MONGODB
========================= */

const client =
    new MongoClient(
        process.env.MONGODB_URI
    );


let db;

let users;

let registrations;

let quizResults;

let progress;


async function connectDatabase() {

    await client.connect();

    db =
        client.db(
            "after_school_coding"
        );

    users =
        db.collection("users");

    registrations =
        db.collection(
            "registrations"
        );

    quizResults =
        db.collection(
            "quiz_results"
        );

    progress =
        db.collection(
            "progress"
        );

    console.log(
        "MongoDB connected successfully"
    );
}


/* =========================
   AUTHENTICATION
========================= */

function authenticateToken(
    req,
    res,
    next
) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({

            message:
                "Authentication required"

        });

    }

    const token =
        authHeader.split(" ")[1];

    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(403).json({

            message:
                "Invalid or expired token"

        });

    }
}


/* =========================
   API HOME
========================= */

app.get(
    "/api",
    (req, res) => {

        res.json({

            message:
                "After School Coding API is running"

        });

    }
);


/* =========================
   REGISTER
========================= */

app.post(
    "/api/register",
    async (req, res) => {

        try {

            const {

                name,
                email,
                password,
                age,
                school,
                phone,
                course

            } = req.body;


            if (
                !name ||
                !email ||
                !password ||
                !age ||
                !school ||
                !course
            ) {

                return res.status(400).json({

                    message:
                        "Please fill all required fields"

                });

            }


            const existingUser =
                await users.findOne({

                    email:
                        email.toLowerCase()

                });


            if (existingUser) {

                return res.status(400).json({

                    message:
                        "Email already registered"

                });

            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            const newUser = {

                name,

                email:
                    email.toLowerCase(),

                password:
                    hashedPassword,

                age:
                    Number(age),

                school,

                phone:
                    phone || "",

                course,

                role:
                    "student",

                createdAt:
                    new Date()

            };


            const result =
                await users.insertOne(
                    newUser
                );


            await registrations.insertOne({

                studentId:
                    result.insertedId,

                name,

                email:
                    email.toLowerCase(),

                school,

                phone:
                    phone || "",

                course,

                registeredAt:
                    new Date()

            });


            res.status(201).json({

                message:
                    "Registration successful",

                userId:
                    result.insertedId

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "Server error"

            });

        }

    }
);


/* =========================
   LOGIN
========================= */

app.post(
    "/api/login",
    async (req, res) => {

        try {

            const {
                email,
                password
            } = req.body;


            const user =
                await users.findOne({

                    email:
                        email.toLowerCase()

                });


            if (!user) {

                return res.status(401).json({

                    message:
                        "Invalid email or password"

                });

            }


            const validPassword =
                await bcrypt.compare(

                    password,

                    user.password

                );


            if (!validPassword) {

                return res.status(401).json({

                    message:
                        "Invalid email or password"

                });

            }


            const token =
                jwt.sign(

                    {

                        id:
                            user._id.toString(),

                        email:
                            user.email,

                        role:
                            user.role,

                        name:
                            user.name

                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "7d"
                    }

                );


            res.json({

                message:
                    "Login successful",

                token,

                user: {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    school:
                        user.school,

                    course:
                        user.course,

                    role:
                        user.role

                }

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "Server error"

            });

        }

    }
);


/* =========================
   PROFILE
========================= */

app.get(
    "/api/profile",
    authenticateToken,
    async (req, res) => {

        try {

            const user =
                await users.findOne(

                    {
                        _id:
                            new ObjectId(
                                req.user.id
                            )
                    },

                    {
                        projection: {
                            password: 0
                        }
                    }

                );


            if (!user) {

                return res.status(404).json({

                    message:
                        "User not found"

                });

            }


            res.json(user);


        } catch (error) {

            res.status(500).json({

                message:
                    "Server error"

            });

        }

    }
);


/* =========================
   QUIZ RESULT
========================= */

app.post(
    "/api/quiz-result",
    authenticateToken,
    async (req, res) => {

        try {

            const {

                quiz,
                score,
                total

            } = req.body;


            const scoreNumber =
                Number(score);

            const totalNumber =
                Number(total);


            const percentage =
                (
                    scoreNumber /
                    totalNumber
                ) * 100;


            const result = {

                studentId:
                    new ObjectId(
                        req.user.id
                    ),

                studentName:
                    req.user.name,

                quiz,

                score:
                    scoreNumber,

                total:
                    totalNumber,

                percentage,

                completedAt:
                    new Date()

            };


            await quizResults.insertOne(
                result
            );


            res.json({

                message:
                    "Quiz result saved",

                result

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "Could not save quiz result"

            });

        }

    }
);


/* =========================
   STUDENT RESULTS
========================= */

app.get(
    "/api/my-results",
    authenticateToken,
    async (req, res) => {

        try {

            const results =
                await quizResults

                    .find({

                        studentId:
                            new ObjectId(
                                req.user.id
                            )

                    })

                    .sort({

                        completedAt:
                            -1

                    })

                    .toArray();


            res.json(results);


        } catch (error) {

            res.status(500).json({

                message:
                    "Could not get results"

            });

        }

    }
);


/* =========================
   UPDATE PROGRESS
========================= */

app.post(
    "/api/progress",
    authenticateToken,
    async (req, res) => {

        try {

            const {

                course,
                completed

            } = req.body;


            await progress.updateOne(

                {

                    studentId:
                        new ObjectId(
                            req.user.id
                        ),

                    course

                },

                {

                    $set: {

                        completed:
                            Boolean(
                                completed
                            ),

                        updatedAt:
                            new Date()

                    }

                },

                {

                    upsert:
                        true

                }

            );


            res.json({

                message:
                    "Progress updated"

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "Could not update progress"

            });

        }

    }
);


/* =========================
   GET PROGRESS
========================= */

app.get(
    "/api/progress",
    authenticateToken,
    async (req, res) => {

        try {

            const data =
                await progress

                    .find({

                        studentId:
                            new ObjectId(
                                req.user.id
                            )

                    })

                    .toArray();


            res.json(data);


        } catch (error) {

            res.status(500).json({

                message:
                    "Could not get progress"

            });

        }

    }
);


/* =========================
   ADMIN LOGIN
========================= */

app.post(
    "/api/admin/login",
    async (req, res) => {

        const {
            email,
            password
        } = req.body;


        if (

            email !==
                process.env.ADMIN_EMAIL ||

            password !==
                process.env.ADMIN_PASSWORD

        ) {

            return res.status(401).json({

                message:
                    "Invalid admin credentials"

            });

        }


        const token =
            jwt.sign(

                {

                    email,

                    role:
                        "admin"

                },

                process.env.JWT_SECRET,

                {

                    expiresIn:
                        "2h"

                }

            );


        res.json({

            message:
                "Admin login successful",

            token

        });

    }
);


/* =========================
   ADMIN STUDENTS
========================= */

app.get(
    "/api/admin/students",
    authenticateToken,
    async (req, res) => {

        try {

            if (
                req.user.role !==
                "admin"
            ) {

                return res.status(403).json({

                    message:
                        "Admin access required"

                });

            }


            const students =
                await users

                    .find(

                        {
                            role:
                                "student"
                        },

                        {

                            projection: {

                                password:
                                    0

                            }

                        }

                    )

                    .sort({

                        createdAt:
                            -1

                    })

                    .toArray();


            res.json(students);


        } catch (error) {

            res.status(500).json({

                message:
                    "Could not get students"

            });

        }

    }
);


/* =========================
   ADMIN QUIZ RESULTS
========================= */

app.get(
    "/api/admin/results",
    authenticateToken,
    async (req, res) => {

        try {

            if (
                req.user.role !==
                "admin"
            ) {

                return res.status(403).json({

                    message:
                        "Admin access required"

                });

            }


            const results =
                await quizResults

                    .find({})

                    .sort({

                        completedAt:
                            -1

                    })

                    .toArray();


            res.json(results);


        } catch (error) {

            res.status(500).json({

                message:
                    "Could not get quiz results"

            });

        }

    }
);


/* =========================
   START SERVER
========================= */

async function startServer() {

    try {

        await connectDatabase();

        app.listen(
            PORT,
            () => {

                console.log(
                    `Server running at http://localhost:${PORT}`
                );

            }
        );

    } catch (error) {

        console.error(
            "Failed to start server:",
            error
        );

    }

}


startServer();