import mongoose from "mongoose";

const simulationScenarioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  month: {
    type: String, // YYYY-MM
    required: true,
  },
  changes: [
    {
      category: String,
      percentChange: Number,
      fixedAmount: Number,
      newAmount: Number,
    },
  ],
  timeframe: {
    type: String, // month, year
    default: "month",
  },
  results: {
    currentSpending: Number,
    simulatedSpending: Number,
    savingsDifference: Number,
    savingsRateImpact: Number,
    goalImpactDays: Number,
    healthScoreImpact: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  savedAt: {
    type: Date,
  },
});

const SimulationScenario = mongoose.model("SimulationScenario", simulationScenarioSchema);

export { SimulationScenario };
