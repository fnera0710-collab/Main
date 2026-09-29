import mongoose from "mongoose";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const answerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    unique_user_id: { type: String, required: true },
    name: { type: String, default: "" },
    timestamp: { type: Date, required: true },
    answers: { type: [mongoose.Schema.Types.Mixed], required: true }
}, { collection: "answers" });

const Answer = mongoose.models.Answer || mongoose.model("Answer", answerSchema);

const mongoCache = globalThis.mongoCache ??= { promise: null };

async function connectToDatabase() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    const uri = process.env.MONGODB_URL || process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri?.trim()) {
        throw new Error("MongoDB connection string is not configured");
    }

    if (mongoose.connection.readyState !== 2) {
        mongoCache.promise = null;
    }

    if (!mongoCache.promise) {
        mongoCache.promise = mongoose.connect(uri.trim(), {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10
        }).then(() => mongoose.connection).catch((error) => {
            mongoCache.promise = null;
            throw error;
        });
    }

    return mongoCache.promise;
}

export async function POST(request) {
    let payload;

    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    if (
        !payload ||
        typeof payload.id !== "string" || !payload.id.trim() ||
        typeof payload.unique_user_id !== "string" || !payload.unique_user_id.trim() ||
        !Array.isArray(payload.answers)
    ) {
        return NextResponse.json({ error: "id, unique_user_id, and answers are required" }, { status: 400 });
    }

    const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
    if (Number.isNaN(timestamp.getTime())) {
        return NextResponse.json({ error: "timestamp must be a valid date" }, { status: 400 });
    }

    try {
        await connectToDatabase();
        const answer = await Answer.create({
            id: payload.id.trim(),
            unique_user_id: payload.unique_user_id.trim(),
            name: typeof payload.name === "string" ? payload.name.trim() : "",
            timestamp,
            answers: payload.answers
        });

        return NextResponse.json({ id: answer.id }, { status: 201 });
    } catch (error) {
        if (error?.code === 11000) {
            return NextResponse.json({ error: "An answer with this id already exists" }, { status: 409 });
        }

        // Avoid logging the connection error object because it may contain the MongoDB URI.
        console.error("[api/answers] Save failed:", error?.name || "Error", error?.code || "");
        return NextResponse.json({ error: "Could not save answers" }, { status: 500 });
    }
}