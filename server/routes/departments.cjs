const express = require('express');
const router = express.Router();
const db = require('../database.cjs');

// Lista todos os departamentos ativos
router.get('/', (req, res) => {
    try {
        const departments = db.prepare(`
            SELECT d.*, 
            (SELECT COUNT(*) FROM groups WHERE department_id = d.id) as groups_count,
            (SELECT COUNT(doc.id) FROM documents doc 
             JOIN groups g ON doc.group_id = g.id 
             WHERE g.department_id = d.id) as docs_count
            FROM departments d
            ORDER BY d.code ASC
        `).all();
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Busca os detalhes e documentos de um departamento específico pelo SLUG
router.get('/:slug', (req, res) => {
    try {
        const { slug } = req.params;
        
        // Busca o departamento
        const dept = db.prepare('SELECT * FROM departments WHERE slug = ?').get(slug);
        
        if (!dept) {
            return res.status(404).json({ message: 'Departamento não encontrado' });
        }

        // Busca os grupos desse departamento
        const groups = db.prepare('SELECT * FROM groups WHERE department_id = ?').all(dept.id);

        // Busca documentos organizados por grupos
        const groupsWithDocs = groups.map(group => {
            const docs = db.prepare('SELECT * FROM documents WHERE group_id = ?').all(group.id);
            return {
                ...group,
                documents: docs
            };
        });

        res.json({
            department: dept,
            groups: groupsWithDocs
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;