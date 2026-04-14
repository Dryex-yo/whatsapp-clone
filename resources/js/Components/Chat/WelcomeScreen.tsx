import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';

/**
 * Welcome Screen Component
 * Displays when no conversation is selected in the chat window
 * Features a 3D-like illustration and WhatsApp for Web description
 */
export default function WelcomeScreen() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 px-4"
        >
            {/* Floating Background Elements */}
            <motion.div
                animate={{ float: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute top-20 left-20 w-40 h-40 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            />
            <motion.div
                animate={{ float: [0, -10, 0] }}
                transition={{ duration: 8, repeat: Infinity, delay: 2 }}
                className="absolute bottom-20 right-20 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            />

            <div className="relative z-10 text-center">
                {/* 3D-like Illustration */}
                <motion.div
                    animate={{ rotateY: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="perspective mb-8"
                    style={{
                        transformStyle: 'preserve-3d',
                    }}
                >
                    <div className="relative w-48 h-48 mx-auto">
                        {/* Main Chat Bubble */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute inset-0 bg-gradient-to-br from-green-400 to-teal-500 rounded-3xl shadow-2xl flex items-center justify-center"
                            style={{
                                transform: 'perspective(1000px) rotateX(10deg) rotateY(-20deg)',
                                boxShadow:
                                    '0 20px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                            }}
                        >
                            {/* Chat Icon */}
                            <svg
                                className="w-24 h-24 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                            </svg>
                        </motion.div>

                        {/* Floating Message Dots */}
                        {[0, 1, 2].map((index) => (
                            <motion.div
                                key={index}
                                animate={{ scale: [0.8, 1.2, 0.8] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: index * 0.1,
                                }}
                                className="absolute w-4 h-4 bg-green-500 rounded-full"
                                style={{
                                    right: `${-30 - index * 15}px`,
                                    top: `${30 + index * 20}px`,
                                }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Header Text */}
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl font-bold text-gray-900 mb-3"
                >
                    WhatsApp for Web
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-gray-600 mb-8 max-w-2xl"
                >
                    Send and receive messages without keeping your phone online
                </motion.p>

                {/* Features List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-left"
                >
                    {[
                        {
                            icon: '🔒',
                            title: 'End-to-End Encrypted',
                            description:
                                'Your messages and calls are always encrypted',
                        },
                        {
                            icon: '📱',
                            title: 'Phone Not Required',
                            description:
                                'Use the web version independently on any device',
                        },
                        {
                            icon: '⚡',
                            title: 'Fast & Responsive',
                            description: 'Lightning-quick message delivery and sync',
                        },
                    ].map((feature) => (
                        <motion.div
                            key={feature.title}
                            whileHover={{ y: -5 }}
                            className="bg-white bg-opacity-60 backdrop-blur-sm rounded-2xl p-6 border border-white border-opacity-40 shadow-lg"
                        >
                            <div className="text-4xl mb-2">{feature.icon}</div>
                            <h3 className="font-semibold text-gray-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                >
                    <Link
                        href={route('chat.index')}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                        Start Messaging
                    </Link>

                    <Link
                        href={route('profile.edit')}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-white text-green-600 rounded-full font-semibold border-2 border-green-500 hover:bg-green-50 transition-all duration-200"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        Profile Settings
                    </Link>
                </motion.div>

                {/* Footer Info */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-sm text-gray-500 max-w-2xl"
                >
                    Select a conversation to start chatting, or create a new chat to begin
                    your conversation. Your messages are secure and encrypted end-to-end.
                </motion.p>
            </div>

            {/* Bottom Accent */}
            <motion.div
                animate={{ width: ['0%', '100%', '0%'] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500"
            />
        </motion.div>
    );
}
