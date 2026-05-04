"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermission = void 0;
const checkPermission = (permission) => (req, res, next) => {
    try {
        if (!req.admin) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const hasPermission = req.admin.role.permissions.some((p) => p.name === permission);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.checkPermission = checkPermission;
