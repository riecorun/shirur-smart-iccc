"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingService = exports.BillingService = void 0;
const store_1 = require("../database/store");
class BillingService {
    calculateMonthlyBill(contractorId, month) {
        const contractor = store_1.db.contractors.get(contractorId);
        if (!contractor) {
            throw new Error(`Contractor with ID ${contractorId} not found`);
        }
        // In a production system this queries the trips table
        const scheduledTrips = contractor.assignedWards.length * 30 * 4; // e.g. 4 trips per day per ward
        const missedTrips = Math.floor(scheduledTrips * (1 - contractor.performanceScorePct / 100));
        const completedTrips = scheduledTrips - missedTrips;
        const missedTripPenalty = missedTrips * contractor.penaltyPerMissedTripInr;
        const stoppagePenalty = 5000;
        const deviationPenalty = 7500;
        const breakdownDeduction = 10000;
        const baseAmount = contractor.monthlyContractValueInr;
        const totalDeductions = missedTripPenalty + stoppagePenalty + deviationPenalty + breakdownDeduction;
        const netPayableAmount = Math.max(0, baseAmount - totalDeductions);
        const invoiceId = `inv-${contractorId}-${month.replace('-', '')}`;
        const invoice = {
            id: invoiceId,
            invoiceNumber: `SNP-INV-${month}-${contractor.name.substring(0, 3).toUpperCase()}`,
            contractorId,
            month,
            baseAmount,
            scheduledTrips,
            completedTrips,
            missedTrips,
            stoppagePenalty,
            deviationPenalty,
            breakdownDeduction,
            netPayableAmount,
            status: 'VERIFIED',
            generatedAt: new Date().toISOString()
        };
        store_1.db.invoices.set(invoice.id, invoice);
        return invoice;
    }
    approveInvoice(invoiceId, approvedBy) {
        const invoice = store_1.db.invoices.get(invoiceId);
        if (!invoice)
            throw new Error('Invoice not found');
        invoice.status = 'APPROVED';
        invoice.approvedBy = approvedBy;
        return invoice;
    }
}
exports.BillingService = BillingService;
exports.billingService = new BillingService();
