import TestOption from "../models/TestOption.model.js";
import TestPanel from "../models/TestPanel.model.js";

// --- Test Options (Dropdowns) ---

export const getTestOptions = async (req, res) => {
    try {
        const { category } = req.query;
        const filter = category ? { category } : {};
        const options = await TestOption.find(filter).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: options });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTestOption = async (req, res) => {
    try {
        const { category, label, value } = req.body;
        const newOption = new TestOption({ category, label, value });
        await newOption.save();
        res.status(201).json({ success: true, data: newOption, message: "Option created successfully." });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "This value already exists in this category." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTestOption = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedOption = await TestOption.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedOption) return res.status(404).json({ success: false, message: "Option not found." });
        res.status(200).json({ success: true, data: updatedOption, message: "Option updated successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTestOption = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOption = await TestOption.findByIdAndDelete(id);
        if (!deletedOption) return res.status(404).json({ success: false, message: "Option not found." });
        res.status(200).json({ success: true, message: "Option deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// --- Test Panels (Cards) ---

export const getTestPanels = async (req, res) => {
    try {
        const panels = await TestPanel.find().sort({ createdAt: 1 });
        res.status(200).json({ success: true, data: panels });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createTestPanel = async (req, res) => {
    try {
        const newPanel = new TestPanel(req.body);
        await newPanel.save();
        res.status(201).json({ success: true, data: newPanel, message: "Panel created successfully." });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "This panel ID already exists." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTestPanel = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPanel = await TestPanel.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!updatedPanel) return res.status(404).json({ success: false, message: "Panel not found." });
        res.status(200).json({ success: true, data: updatedPanel, message: "Panel updated successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteTestPanel = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPanel = await TestPanel.findByIdAndDelete(id);
        if (!deletedPanel) return res.status(404).json({ success: false, message: "Panel not found." });
        res.status(200).json({ success: true, message: "Panel deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
