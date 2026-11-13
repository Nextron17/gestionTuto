"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const tutorias_routes_1 = __importDefault(require("./routes/tutorias.routes"));
const horarios_routes_1 = __importDefault(require("./routes/horarios.routes"));
const recursos_routes_1 = __importDefault(require("./routes/recursos.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', auth_routes_1.default);
app.use('/api/tutorias', tutorias_routes_1.default);
app.use('/api/horarios', horarios_routes_1.default);
app.use('/api/recursos', recursos_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gestion_tutorias';
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
})
    .catch((error) => {
    console.error('Error conectando a MongoDB:', error);
});
