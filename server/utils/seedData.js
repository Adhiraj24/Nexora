import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DailyQuestion from '../models/DailyQuestion.js';
import Compliment from '../models/Compliment.js';
import GameQuestion from '../models/GameQuestion.js';
import AlmostSaid from '../models/AlmostSaid.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Daily Questions
    const questions = [
      "If you could teleport anywhere right now, where would you go?",
      "What instantly improves your mood?",
      "What is your most useless talent?",
      "What's the best compliment you've ever received?",
      "If you could have dinner with anyone, dead or alive, who would it be?",
      "What's something you've always wanted to learn?",
      "What's your favorite way to spend a weekend?",
      "If you could live in any time period, when would it be?"
    ];

    for (const q of questions) {
      await DailyQuestion.findOneAndUpdate(
        { question: q },
        { question: q, date: new Date(), active: true },
        { upsert: true }
      );
    }

    // Compliments
    const compliments = [
      "You're surprisingly easy to talk to.",
      "You're actually pretty fun to talk to.",
      "Don't let this get to your head, but I like talking to you.",
      "You make me smile more than I'd like to admit.",
      "Talking to you is the best part of my day.",
      "You're becoming my favorite person to talk to.",
      "I appreciate how you always listen.",
      "You get me in a way most people don't."
    ];

    for (const c of compliments) {
      await Compliment.findOneAndUpdate(
        { text: c },
        { text: c, active: true },
        { upsert: true }
      );
    }

    // Game Questions - Would You Rather
    const wyrQuestions = [
      {
        question: "Would you rather...",
        optionA: "Have the ability to fly",
        optionB: "Be invisible"
      },
      {
        question: "Would you rather...",
        optionA: "Travel to the past",
        optionB: "Travel to the future"
      },
      {
        question: "Would you rather...",
        optionA: "Always be 10 minutes late",
        optionB: "Always be 20 minutes early"
      },
      {
        question: "Would you rather...",
        optionA: "Live without music",
        optionB: "Live without movies"
      },
      {
        question: "Would you rather...",
        optionA: "Have unlimited coffee",
        optionB: "Have unlimited pizza"
      }
    ];

    for (const q of wyrQuestions) {
      await GameQuestion.findOneAndUpdate(
        { gameType: 'would-you-rather', question: q.question, optionA: q.optionA },
        { ...q, gameType: 'would-you-rather', active: true },
        { upsert: true }
      );
    }

    // Almost Said messages
    const almostSaids = [
      "I was going to tell you something... never mind.",
      "You're becoming my favorite person to talk to.",
      "Okay, you're actually pretty fun to talk to.",
      "I might be starting to like you... just a little.",
      "I was thinking about you earlier today.",
      "You make me laugh more than anyone else."
    ];

    for (const msg of almostSaids) {
      await AlmostSaid.findOneAndUpdate(
        { text: msg },
        { text: msg, active: true },
        { upsert: true }
      );
    }

    console.log('✅ Data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();