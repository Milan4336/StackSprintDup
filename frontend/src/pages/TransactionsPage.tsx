import { Transactions as LegacyTransactionsTable } from './Transactions';
import { useTransactionsSlice } from '../store/slices/transactionsSlice';
import { useEffect } from 'react';

export const Transactions = () => {
    const { connectLive, disconnectLive } = useTransactionsSlice();

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, [connectLive, disconnectLive]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* The existing Transactions component contains the table, filters, and forensics modal */}
            {/* We will render it directly here for the Transactions page module, keeping the complex search filters intact */}
            <LegacyTransactionsTable />
        </div>
    );
};
