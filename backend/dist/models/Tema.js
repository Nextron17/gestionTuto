"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const temaSchema = new mongoose_1.Schema({
    nombre: { type: String, required: true },
    materia: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Materia', required: true }
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Tema', temaSchema);
