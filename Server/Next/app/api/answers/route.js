import mongoose from "mongoose";
import { NextResponse } from "next/server";

const answerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    unique_user_id: { type: String, required: true },
    name: { type: String, default: "" },
    timestamp: { type: Date, required: true },
    answers: { type: [mongoose.Schema.Types.Mixed], required: true }
}, { collection: "answers" });

const Answer = mongoose.models.Answer || mongoose.model("Answer", answerSchema);

const globalForMongo = globalThis;

async function connectToDatabase() {
    if (mongoose.connection.readyState === 1) return;

    if (!process.env.MONGODB_URL) {
        throw new Error("MONGODB_URL не настроен");
    }

    globalForMongo.mongoConnection ??= mongoose.connect(process.env.MONGODB_URL, {
        serverSelectionTimeoutMS: 10000
    }).catch((error) => {
        globalForMongo.mongoConnection = undefined;
        throw error;
    });

    await globalForMongo.mongoConnection;
}

export async function POST(request) {
    try {
        const payload = await request.json();

        if (!payload.id || !Array.isArray(payload.answers) || !payload.unique_user_id) {
            return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
        }

        await connectToDatabase();
        const answer = await Answer.create({
            id: payload.id,
            unique_user_id: payload.unique_user_id,
            name: typeof payload.name === "string" ? payload.name.trim() : "",
            timestamp: payload.timestamp || new Date(),
            answers: payload.answers
        });

        return NextResponse.json({ id: answer.id }, { status: 201 });
    } catch (error) {
        console.error("Ошибка сохранения ответов:", error);
        return NextResponse.json({ error: "Не удалось сохранить ответы" }, { status: 500 });
    }
}