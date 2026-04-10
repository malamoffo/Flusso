import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TelegramChannel, TelegramMessage } from '../types';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface TelegramThreadViewProps {
  channel: TelegramChannel;
  messages: TelegramMessage[];
  onClose: () => void;
}

export const TelegramThreadView = memo(({ channel, messages, onClose }: TelegramThreadViewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <header className="flex items-center p-4 border-b border-gray-800 bg-black/80 backdrop-blur-md z-10">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800 text-gray-300 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-white ml-4">{channel.name}</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
        {messages.map(message => (
          <div key={message.id} className="mb-4 p-3 bg-gray-900 rounded-lg">
            <p className="text-gray-300">{message.text}</p>
            {message.imageUrl && <img src={message.imageUrl} alt="" className="mt-2 rounded-lg" />}
            <p className="text-xs text-gray-500 mt-2">{format(message.date, 'HH:mm dd/MM/yy')}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
});
