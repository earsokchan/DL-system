// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://sokchanear0:s0fazZgdGvLxxGEW@cluster0.gf1nfv0.mongodb.net/cloudflare-images?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Schema for Ice Order
const iceOrderSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    iceOrders: {
        originalIce: [{
            quantity: { type: Number, default: 0 },
            price: { type: Number, default: 0 },
        }],
        largeHygiene20kg: [{
            quantity: { type: Number, default: 0 },
            price: { type: Number, default: 0 },
        }],
        largeHygiene30kg: [{
            quantity: { type: Number, default: 0 },
            price: { type: Number, default: 0 },
        }],
        smallHygiene20kg: [{
            quantity: { type: Number, default: 0 },
            price: { type: Number, default: 0 },
        }],
        smallHygiene30kg: [{
            quantity: { type: Number, default: 0 },
            price: { type: Number, default: 0 },
        }],
    },
    previousDebt: { type: Number, default: 0 },
    newDebt: { type: Number, default: 0 },
    payment: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 },
    totalDebt: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

// Pre-save hook to calculate totalDebt before saving
iceOrderSchema.pre('save', function (next) {
    this.totalDebt = (this.previousDebt || 0) + (this.newDebt || 0) - (this.payment || 0);
    next();
});

const IceOrder = mongoose.model('IceOrder', iceOrderSchema);

// Schema for saving individual customer reports
const reportSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    customersData: [{
        _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
        customerName: String,
        iceOrders: Object,
        previousDebt: Number,
        newDebt: Number,
        payment: Number,
        expenses: Number,
        totalDebt: Number,
    }],
});

const Report = mongoose.model('Report', reportSchema);

// Schema for saving the grand totals from the table
const tableTotalReportSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    totalIceQuantity: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    totalPrevDebt: { type: Number, default: 0 },
    totalNewDebt: { type: Number, default: 0 },
    totalPayment: { type: Number, default: 0 },
    totalTotalDebt: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    totalNetIncome: { type: Number, default: 0 },
});

const TableTotalReport = mongoose.model('TableTotalReport', tableTotalReportSchema);

// Routes for Ice Orders
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        const formattedOrder = {
            ...orderData,
            iceOrders: {
                originalIce: orderData.iceOrders.originalIce.map(item => ({
                    quantity: Number(item.quantity) || 0,
                    price: Number(item.price) || 0,
                 })),
                largeHygiene20kg: orderData.iceOrders.largeHygiene20kg.map(item => ({
                    quantity: Number(item.quantity) || 0,
                    price: Number(item.price) || 0,
                 })),
                largeHygiene30kg: orderData.iceOrders.largeHygiene30kg.map(item => ({
                    quantity: Number(item.quantity) || 0,
                    price: Number(item.price) || 0,
                 })),
                smallHygiene20kg: orderData.iceOrders.smallHygiene20kg.map(item => ({
                    quantity: Number(item.quantity) || 0,
                    price: Number(item.price) || 0,
                 })),
                smallHygiene30kg: orderData.iceOrders.smallHygiene30kg.map(item => ({
                    quantity: Number(item.quantity) || 0,
                    price: Number(item.price) || 0,
                })),
            },
            previousDebt: Number(orderData.previousDebt) || 0,
            newDebt: Number(orderData.newDebt) || 0,
            payment: Number(orderData.payment) || 0,
            expenses: Number(orderData.expenses) || 0,
        };
        const order = new IceOrder(formattedOrder);
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const orders = await IceOrder.find();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/orders/:id', async (req, res) => {
    try {
        const order = await IceOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    try {
        const { customerName, iceOrders, newDebt, payment, expenses, previousDebt } = req.body;
        const order = await IceOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (customerName !== undefined) order.customerName = customerName;
        if (expenses !== undefined) order.expenses = Number(expenses);
        if (newDebt !== undefined) order.newDebt = Number(newDebt);
        if (payment !== undefined) order.payment = Number(payment);
        if (previousDebt !== undefined) order.previousDebt = Number(previousDebt);

        if (iceOrders) {
            for (const type in iceOrders) {
                if (order.iceOrders[type]) {
                    order.iceOrders[type] = iceOrders[type].map(item => ({
                        quantity: Number(item.quantity) || 0,
                        price: Number(item.price) || 0,
                    }));
                }
            }
        }

        await order.save();
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/orders/:id/add-debt', async (req, res) => {
    try {
        const { amount } = req.body;
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Amount to add must be a positive number.' });
        }

        const order = await IceOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.newDebt = (order.newDebt || 0) + amount;
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/orders/:id/add-payment', async (req, res) => {
    try {
        const { amount } = req.body;
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ message: 'Payment amount must be a positive number.' });
        }

        const order = await IceOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.payment = (order.payment || 0) + amount;
        await order.save();
        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const order = await IceOrder.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Routes for Reports
app.post('/api/reports', async (req, res) => {
    try {
        const reportData = req.body;
        const newReport = new Report(reportData);
        await newReport.save();
        res.status(201).json(newReport);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.get('/api/reports', async (req, res) => {
    try {
        const reports = await Report.find();
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/reports/:id', async (req, res) => {
    try {
        const deleted = await Report.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Report not found' });
        }
        res.json({ message: 'Report deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// NEW ROUTE: Delete a specific customer from a report
app.delete('/api/reports/:reportId/customer/:customerId', async (req, res) => {
    try {
        const { reportId, customerId } = req.params;
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }
        const customerIndex = report.customersData.findIndex(c => c._id.toString() === customerId);
        if (customerIndex === -1) {
            return res.status(404).json({ message: 'Customer not found in report' });
        }
        report.customersData.splice(customerIndex, 1);
        await report.save();
        res.json({ message: 'Customer deleted successfully from report', report });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Routes for Table Totals
app.post('/api/table-totals', async (req, res) => {
    try {
        const tableTotalsData = req.body;
        const newTableTotalReport = new TableTotalReport(tableTotalsData);
        await newTableTotalReport.save();
        res.status(201).json(newTableTotalReport);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to save table totals.' });
    }
});

app.get('/api/table-totals', async (req, res) => {
    try {
        const tableTotals = await TableTotalReport.find();
        res.json(tableTotals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/table-totals/:id', async (req, res) => {
    try {
        const deleted = await TableTotalReport.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Table total not found' });
        }
        res.json({ message: 'Table total deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});