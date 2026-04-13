import Example from "../models/Example.js";

export const getExamples = async (_req, res) => {
    try {
        const examples = await Example.find()
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({ examples });
    } catch (error) {
        console.error("GET EXAMPLES ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createExample = async (req, res) => {
    try {
        const { title, code } = req.body;

        if (!title || !code) {
            return res.status(400).json({ message: "Title and code are required" });
        }

        const example = await Example.create({
            title,
            code,
            createdBy: req.user.userId,
        });

        res.status(201).json({ message: "Example created", example });
    } catch (error) {
        console.error("CREATE EXAMPLE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteExample = async (req, res) => {
    try {
        const { id } = req.params;

        const example = await Example.findByIdAndDelete(id);
        if (!example) {
            return res.status(404).json({ message: "Example not found" });
        }

        res.status(200).json({ message: "Example deleted successfully" });
    } catch (error) {
        console.error("DELETE EXAMPLE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};
