const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

const app = express();
app.use(cors());

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Initialize Gemini API with the key directly (temporary for testing)
const genAI = new GoogleGenerativeAI("AIzaSyCwYy-alM1qOKfDYRFsyS2sHlzbuioyTB0");

// Use hardcoded key
const STABILITY_API_KEY = 'sk-X0Wz59YQcPFIxrGw9ygZK7wWE253pUXHYvuAJTpG8GaQdFD4';

// Add this near the top with other constants
// const UNSPLASH_API_KEY = 'YOUR_UNSPLASH_API_KEY';  // You'll need to get this from Unsplash
// const PEXELS_API_KEY = 'YOUR_PEXELS_API_KEY';  // Get this from Pexels

// Add this after your imports
const ingredientShelfLife = {
  tomatoes: { room: "5-7 days", refrigerated: "1-2 weeks", frozen: "6-8 months" },
  lettuce: { room: "1-2 days", refrigerated: "7-10 days", frozen: "Not recommended" },
  onions: { room: "2-3 months", refrigerated: "1-2 months", frozen: "8-12 months" },
  garlic: { room: "3-5 months", refrigerated: "1-2 months", frozen: "10-12 months" },
  ginger: { room: "1 week", refrigerated: "1 month", frozen: "6 months" },
  carrots: { room: "3-5 days", refrigerated: "2-3 weeks", frozen: "8-12 months" },
  potatoes: { room: "2-3 weeks", refrigerated: "3-4 months", frozen: "10-12 months" },
  mushrooms: { room: "2-3 days", refrigerated: "7-10 days", frozen: "8-12 months" },
  peppers: { room: "4-5 days", refrigerated: "1-2 weeks", frozen: "10-12 months" },
  celery: { room: "1-2 days", refrigerated: "1-2 weeks", frozen: "10-12 months" },
  herbs: { room: "2-3 days", refrigerated: "1-2 weeks", frozen: "6 months" },
  lemons: { room: "1 week", refrigerated: "2-3 weeks", frozen: "3-4 months" },
  limes: { room: "1 week", refrigerated: "2-3 weeks", frozen: "3-4 months" },
  apples: { room: "1-2 weeks", refrigerated: "4-6 weeks", frozen: "8 months" },
  sunflowerseeds: { room: "2-3 months", refrigerated: "4-6 months", frozen: "1 year" },
  quinoa: { room: "2-3 years", refrigerated: "3-4 years", frozen: "4-5 years" },
  driedapricots: { room: "6-12 months", refrigerated: "1-2 years", frozen: "1-2 years" },
  eggplants: { room: "2-3 days", refrigerated: "5-7 days", frozen: "6-8 months" },
  pumpkin: { room: "2-3 months", refrigerated: "3-4 months", frozen: "6-8 months" },
  smallredpeppers: { room: "1-2 weeks", refrigerated: "2-3 weeks", frozen: "6 months" },
  leeks: { room: "3-5 days", refrigerated: "1-2 weeks", frozen: "3-4 months" },
  brazilnuts: { room: "6-9 months", refrigerated: "9-12 months", frozen: "1-2 years" },
  beetroot: { room: "3-5 days", refrigerated: "2-3 weeks", frozen: "6-8 months" },
  cheese: { room: "2-4 hours", refrigerated: "1-4 weeks", frozen: "6-8 months" },
  flaxseeds: { room: "6-12 months", refrigerated: "1-2 years", frozen: "1-2 years" },
  mint: { room: "7-10 days", refrigerated: "2-3 weeks", frozen: "3-4 months" },
  rosemary: { room: "1-2 weeks", refrigerated: "2-3 weeks", frozen: "4-6 months" }
};

// Update the image analysis endpoint
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert image buffer to base64
    const imageBase64 = req.file.buffer.toString('base64');

    // Initialize the model with gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create prompt for ingredient detection
    const prompt = "List all the ingredients you can identify in this food image. Format them as a comma-separated list. Only include actual ingredients, not dishes or preparations.";

    // Generate content
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: imageBase64
            }
          }
        ]
      }]
    });

    const response = await result.response;
    const text = response.text();
    console.log('API Response:', text);

    // Process the response to get ingredients with shelf life
    const ingredients = text
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(item => item.length > 0 && item !== ',')  // Filter out empty items and lone commas
      .map(ingredient => {
        // Clean the ingredient name
        const cleanName = ingredient
          .replace(/^[,\s]+|[,\s]+$/g, '')  // Remove leading/trailing commas and spaces
          .replace(/\s+/g, ' ');  // Normalize spaces

        return {
          name: cleanName,
          shelfLife: ingredientShelfLife[cleanName] || {
            room: "Varies",
            refrigerated: "Varies",
            frozen: "Varies"
          }
        };
      })
      .filter(item => item.name.length > 0);  // Final filter for any empty names

    if (ingredients.length === 0) {
      throw new Error('No ingredients detected in the image');
    }

    console.log('Processed ingredients:', ingredients); // Debug log
    res.json({ ingredients });

  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ 
      error: 'Failed to analyze image',
      details: error.message 
    });
  }
});

// Add a root route handler
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Recipe generation endpoint
app.get('/recipeStream', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { ingredients, mealType, cuisine, cookingTime, complexity } = req.query;
    
    // Add debug logs
    console.log('Received recipe request with:', {
      ingredients,
      mealType,
      cuisine,
      cookingTime,
      complexity
    });

    if (!ingredients || !mealType || !cuisine || !cookingTime || !complexity) {
      throw new Error('Please fill in all fields');
    }

    const prompt = `Create a recipe with the following specifications:
    - Cuisine: ${cuisine}
    - Meal Type: ${mealType}
    - Cooking Time: ${cookingTime}
    - Complexity: ${complexity}
    - Main Ingredients: ${ingredients}

    Format the recipe exactly like this:

    [Recipe Name]
    =============

    DETAILS
    -------
    • Cuisine: [cuisine type]
    • Meal Type: [meal type]
    • Cooking Time: [time]
    • Complexity: [level]

    INGREDIENTS
    ----------
    • [ingredient 1]
    • [ingredient 2]
    • [ingredient 3]

    INSTRUCTIONS
    -----------
    1. [First step]
    2. [Second step]
    3. [Third step]

    COOKING TIPS
    -----------
    • [Tip 1]
    • [Tip 2]

    SERVINGS: [number]`;

    console.log('Sending prompt to Gemini:', prompt); // Debug log

    // Initialize the model for recipe generation
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const formatRecipeResponse = (text) => {
      // Split the response into sections
      const sections = text.split(/\n(?=[A-Z]+:?(?:\n|$))/);
      
      let formattedSections = [];
      
      sections.forEach(section => {
        if (section.includes('DETAILS')) {
          const details = section
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.trim())
            .join('\n');
          formattedSections.push(details);
        }
        else if (section.includes('INGREDIENTS')) {
          const ingredients = section
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.trim())
            .join('\n');
          formattedSections.push('\n' + ingredients + '\n');
        }
        else if (section.includes('INSTRUCTIONS')) {
          const instructions = section
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.trim())
            .join('\n');
          formattedSections.push('\n' + instructions + '\n');
        }
        else if (section.includes('COOKING TIPS')) {
          const tips = section
            .split('\n')
            .filter(line => line.trim())
            .map(line => line.trim())
            .join('\n');
          formattedSections.push('\n' + tips + '\n');
        }
        else if (section.includes('SERVINGS')) {
          formattedSections.push('\n' + section.trim());
        }
        else {
          // This is the title
          formattedSections.push(section.trim() + '\n=================\n');
        }
      });

      return formattedSections.join('\n');
    };

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Format the text
      const formattedText = formatRecipeResponse(text);
      
      // Split into lines and send
      const lines = formattedText.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {  // Only send non-empty lines
          res.write(`data: ${JSON.stringify({ action: 'chunk', chunk: line + '\n' })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

      res.write(`data: ${JSON.stringify({ action: 'close' })}\n\n`);
      res.end();
    } catch (genError) {
      console.error('Gemini API Error:', genError);
      throw new Error('Failed to generate recipe');
    }

  } catch (error) {
    console.error('Error:', error);
    res.write(`data: ${JSON.stringify({ action: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

// Update back to the original generateImage endpoint
app.get('/generateImage', async (req, res) => {
  try {
    const { recipeName } = req.query;
    
    // Log to verify we're using the correct key
    console.log('Using Stability API key:', STABILITY_API_KEY.substring(0, 10) + '...');
    
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Create prompt for image description
    const imagePrompt = `Create a detailed description for a food photography of ${recipeName}. 
    Focus on plating, garnishes, and presentation. Make it look appetizing and professional.
    Format: Only provide the description, no additional text.`;

    const result = await model.generateContent(imagePrompt);
    const imageDescription = result.response.text();
    
    console.log('Generated description:', imageDescription); // Debug log

    // Now use this description to generate an image using Stability API
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: `Professional food photography of ${recipeName}. ${imageDescription}`,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 512,
        width: 512,
        samples: 1,
        steps: 30,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Stability API error:', errorData); // Debug log
      throw new Error(`Stability API error: ${errorData.message}`);
    }

    const imageData = await response.json();
    res.json({ imageUrl: imageData.artifacts[0].base64 });

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});