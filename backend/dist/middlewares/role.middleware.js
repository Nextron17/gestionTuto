"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permitirRoles = void 0;
const permitirRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
        }
        next();
    };
};
exports.permitirRoles = permitirRoles;
