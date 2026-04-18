import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowUp, ArrowDown, Check, Clock, CreditCard } from 'lucide-react';

interface Transaction {
    id: string;
    type: 'send' | 'topup';
    amount: number;
    recipient?: string;
    timestamp: Date;
    status: 'success' | 'pending';
}

interface Props {
    onBack: () => void;
}

export const WalletSection = ({ onBack }: Props) => {
    const [isTopUpOpen, setIsTopUpOpen] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState('');

    // Mock transaction data
    const [transactions] = useState<Transaction[]>([
        {
            id: '1',
            type: 'send',
            amount: 50000,
            recipient: 'Ahmad M.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'success',
        },
        {
            id: '2',
            type: 'topup',
            amount: 100000,
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            status: 'success',
        },
        {
            id: '3',
            type: 'send',
            amount: 25000,
            recipient: 'Siti A.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: 'success',
        },
        {
            id: '4',
            type: 'topup',
            amount: 200000,
            timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
            status: 'success',
        },
        {
            id: '5',
            type: 'send',
            amount: 75000,
            recipient: 'Rudi B.',
            timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
            status: 'pending',
        },
    ]);

    const totalBalance = 450000;

    const handleTopUp = () => {
        if (topUpAmount.trim()) {
            setIsTopUpOpen(false);
            setTopUpAmount('');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
            return `${diffInMinutes} min ago`;
        } else if (diffInHours < 24) {
            return `${diffInHours} hours ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays} days ago`;
        }
    };

    return (
        <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-50 flex flex-col bg-[#111b21]"
        >
            {/* Header */}
            <div className="h-[70px] bg-[#202c33] flex items-center px-6 shadow-lg">
                <div className="flex items-center gap-6 text-[#d1d7db] w-full">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="transition-transform flex-shrink-0"
                        onClick={onBack}
                    >
                        <ArrowLeft className="w-6 h-6 cursor-pointer hover:text-white transition-colors" />
                    </motion.button>
                    <h1 className="text-xl font-medium">Dompet</h1>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Balance Card */}
                <div className="px-4 py-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-[#00a884] to-[#00704b] rounded-2xl p-6 shadow-lg"
                    >
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <p className="text-white/70 text-sm font-medium mb-2">Saldo Total</p>
                                <p className="text-4xl font-bold text-white">{formatCurrency(totalBalance)}</p>
                            </div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="bg-white/20 p-3 rounded-full backdrop-blur-sm"
                            >
                                <CreditCard className="w-6 h-6 text-white" />
                            </motion.div>
                        </div>

                        {/* Top Up Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setIsTopUpOpen(!isTopUpOpen)}
                            className="w-full bg-white text-[#00a884] font-semibold py-3 rounded-lg transition-all duration-200 hover:bg-gray-100 shadow-md"
                        >
                            {isTopUpOpen ? 'Batal' : 'Top Up'}
                        </motion.button>

                        {/* Top Up Input */}
                        {isTopUpOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-3"
                            >
                                <input
                                    type="number"
                                    placeholder="Jumlah (Rp)"
                                    value={topUpAmount}
                                    onChange={(e) => setTopUpAmount(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-colors"
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleTopUp}
                                    className="w-full bg-white text-[#00a884] font-semibold py-2 rounded-lg transition-all duration-200 hover:bg-gray-100"
                                >
                                    Lanjutkan
                                </motion.button>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* Transaction History Header */}
                <div className="px-6 py-4 sticky top-0 bg-[#111b21] z-10 border-b border-[#2a3a42]">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <div className="w-1 h-6 bg-[#00a884] rounded-full" />
                        Riwayat Transaksi
                    </h2>
                </div>

                {/* Transaction List */}
                <div className="px-4 pb-6">
                    <div className="space-y-3">
                        {transactions.map((transaction, index) => (
                            <motion.div
                                key={transaction.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-[#1f2937] rounded-lg p-4 border border-[#2a3a42] hover:border-[#00a884]/30 transition-all duration-200 group cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    {/* Left Content */}
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Icon */}
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            className={`p-3 rounded-full ${
                                                transaction.type === 'send'
                                                    ? 'bg-red-500/20'
                                                    : 'bg-green-500/20'
                                            }`}
                                        >
                                            {transaction.type === 'send' ? (
                                                <ArrowUp className={`w-5 h-5 ${transaction.status === 'success' ? 'text-red-400' : 'text-yellow-400'}`} />
                                            ) : (
                                                <ArrowDown className="w-5 h-5 text-green-400" />
                                            )}
                                        </motion.div>

                                        {/* Details */}
                                        <div className="flex-1">
                                            <h3 className="text-white font-medium">
                                                {transaction.type === 'send'
                                                    ? `Kirim ke ${transaction.recipient}`
                                                    : 'Top Up Saldo'}
                                            </h3>
                                            <p className="text-sm text-gray-400 flex items-center gap-1">
                                                {transaction.status === 'pending' ? (
                                                    <>
                                                        <Clock className="w-3 h-3" />
                                                        Tertunda
                                                    </>
                                                ) : (
                                                    <>
                                                        <Check className="w-3 h-3 text-green-400" />
                                                        {formatTime(transaction.timestamp)}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Amount */}
                                    <div className="text-right">
                                        <p className={`font-semibold ${
                                            transaction.type === 'send'
                                                ? 'text-red-400'
                                                : 'text-green-400'
                                        }`}>
                                            {transaction.type === 'send' ? '-' : '+'}
                                            {formatCurrency(transaction.amount)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Security Notice */}
                <div className="px-6 py-6 bg-[#1f2937]/50 border-t border-[#2a3a42]">
                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                        🔒 Transaksi Anda dilindungi dengan enkripsi end-to-end. Data keuangan Anda aman dan tidak dapat diakses oleh pihak ketiga.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
