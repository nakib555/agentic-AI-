/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FunctionDeclaration, Type } from "@google/genai";

export const longRunningTaskDeclaration: FunctionDeclaration = {
  name: 'longRunningTask',
  description: 'Initiates or continues a complex, multi-step task. Call without arguments to start, then call again with the returned taskId to continue.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      taskId: { type: Type.STRING, description: 'The ID of the task to continue. Omit to start a new task.' },
    },
  },
};

type TaskState = { step: number; totalSteps: number };
type TaskStates = Record<string, TaskState>;

// Helper function to read task states from localStorage
const getTaskStates = (): TaskStates => {
    try {
        const storedStates = localStorage.getItem('taskStates');
        return storedStates ? JSON.parse(storedStates) : {};
    } catch (error) {
        console.error("Failed to parse task states from localStorage:", error);
        return {};
    }
};

// Helper function to write task states to localStorage
const setTaskStates = (states: TaskStates) => {
    try {
        localStorage.setItem('taskStates', JSON.stringify(states));
    } catch (error) {
        console.error("Failed to save task states to localStorage:", error);
    }
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const executeLongRunningTask = (args: { taskId?: string }): string => {
  const { taskId } = args;
  const taskStates = getTaskStates();
  let responseMessage = "";

  if (!taskId) {
    // Start a new task
    const newTaskId = generateId();
    taskStates[newTaskId] = { step: 1, totalSteps: 3 };
    responseMessage = `Task started with ID ${newTaskId}. Status: Step 1 of 3 (Data Ingestion) is complete. Call this function again with the taskId to continue to the next step.`;
  } else {
    if (!taskStates[taskId]) {
        throw new Error(`Task with ID "${taskId}" not found.`);
    }
    
    const task = taskStates[taskId];
    task.step += 1;

    if (task.step === 2) {
        responseMessage = `Task ${taskId} is progressing. Status: Step 2 of 3 (Data Analysis) is complete. Call this function again with the taskId to continue.`;
    } else if (task.step >= task.totalSteps) {
        delete taskStates[taskId]; // Clean up completed task
        responseMessage = `Task ${taskId} is complete. Final result: Quarterly analysis report is ready.`;
    } else {
        // This case shouldn't be hit with totalSteps=3, but it's good practice
        responseMessage = `Task ${taskId} is progressing. Status: Step ${task.step} of ${task.totalSteps} complete.`;
    }
  }

  setTaskStates(taskStates);
  return responseMessage;
};