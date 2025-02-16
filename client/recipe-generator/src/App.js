import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const RecipeCard = ({ onSubmit }) => {
  const [ingredients, setIngredients] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [cuisine, setCuisine] = useState("");
  const [cookingTime, setCookingTime] = useState("Less than 30 minutes");
  const [complexity, setComplexity] = useState("Beginner");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [ingredientsList, setIngredientsList] = useState([]);

  const handleSubmit = () => {
    console.log('Submitting with values:', {
      ingredients,
      mealType,
      cuisine,
      cookingTime,
      complexity
    });

    if (!ingredients || !mealType || !cuisine || !cookingTime || !complexity) {
      console.log('Missing fields:', {
        ingredients: !ingredients,
        mealType: !mealType,
        cuisine: !cuisine,
        cookingTime: !cookingTime,
        complexity: !complexity
      });
      setError("Please fill in all fields");
      return;
    }

    const recipeData = {
      ingredients,
      mealType,
      cuisine,
      cookingTime,
      complexity,
    };
    
    console.log('Submitting recipe data:', recipeData);
    onSubmit(recipeData);
  };

  const handleImageUpload = async (event) => {
    setError("");
    setIsLoading(true);
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        setIsLoading(false);
        return;
      }

      setImagePreview(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('http://localhost:3001/analyze-image', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to analyze image');
        }

        const data = await response.json();
        console.log('Received ingredients:', data.ingredients); // Debug log

        if (data.ingredients && data.ingredients.length > 0) {
          const processedIngredients = data.ingredients.filter(ing => ing.name && ing.name.trim());
          setIngredientsList(processedIngredients);
          setIngredients(processedIngredients.map(ing => ing.name.trim()).join(', '));
        } else {
          setError("No ingredients detected. Please try a different image.");
        }
      } catch (error) {
        setError(error.message);
        setImagePreview(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col">
      {/* Main Form Card */}
      <div className="w-[400px] border rounded-lg overflow-hidden shadow-lg mb-4">
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">Recipe Generator</div>
          {/* Upload Section */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Upload Food Image
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-gray-500 rounded-lg shadow-lg tracking-wide border border-blue cursor-pointer hover:bg-blue-50">
                <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                </svg>
                <span className="mt-2 text-sm">Select an image</span>
                <input
                  type='file'
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-lg" />
              </div>
            )}
          </div>

          {/* Form Fields */}
        <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
            Ingredients
          </label>
          <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            placeholder="Enter ingredients"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="mealType"
          >
            Meal Type
          </label>
          <select
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            id="mealType"
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
          >
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snack">Snack</option>
          </select>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="cuisine"
          >
            Cuisine Preference
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="cuisine"
            type="text"
            placeholder="e.g., Italian, Mexican"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="cookingTime"
          >
            Cooking Time
          </label>
          <select
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            id="cookingTime"
            value={cookingTime}
            onChange={(e) => setCookingTime(e.target.value)}
          >
            <option value="Less than 30 minutes">Less than 30 minutes</option>
            <option value="30-60 minutes">30-60 minutes</option>
            <option value="More than 1 hour">More than 1 hour</option>
          </select>
        </div>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="complexity"
          >
            Complexity
          </label>
          <select
            className="block appearance-none w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
            id="complexity"
            value={complexity}
            onChange={(e) => setComplexity(e.target.value)}
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div className="px-6 py-4">
          <button
              className="bg-accent-primary hover:bg-accent-secondary transition-colors duration-300 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary w-full"
            type="button"
            onClick={handleSubmit}
          >
            Generate Recipe
          </button>
        </div>
      </div>
      </div>

      {/* Shelf Life Table Card */}
      {ingredientsList.length > 0 && (
        <div className="w-[400px] border rounded-lg overflow-hidden shadow-lg bg-white">
          <div className="px-6 py-4">
            <h3 className="text-lg font-semibold mb-4">Ingredient Storage Guide</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Fridge</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Frozen</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ingredientsList.map((ingredient, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-3 py-2 whitespace-nowrap capitalize text-sm">{ingredient.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{ingredient.shelfLife?.room || "Varies"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{ingredient.shelfLife?.refrigerated || "Varies"}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{ingredient.shelfLife?.frozen || "Varies"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  const [recipeData, setRecipeData] = useState(null);
  const [recipeText, setRecipeText] = useState("");
  const [recipeImage, setRecipeImage] = useState(null);

  let eventSourceRef = useRef(null);

  useEffect(() => {
    closeEventStream();
  }, []);

  useEffect(() => {
    if (recipeData) {
      closeEventStream();
      initializeEventStream();
    }
  }, [recipeData]);

  const initializeEventStream = () => {
    const recipeInputs = { ...recipeData };
    const queryParams = new URLSearchParams(recipeInputs).toString();
    const url = `http://localhost:3001/recipeStream?${queryParams}`;
    console.log('Connecting to:', url); // Debug log
    eventSourceRef.current = new EventSource(url);

    eventSourceRef.current.onmessage = (event) => {
      console.log('Received message:', event.data); // Debug log
      const data = JSON.parse(event.data);
      if (data.action === "close") {
        closeEventStream();
        // Get recipe name and generate image
        const recipeName = recipeText.split('\n')[0];
        generateRecipeImage(recipeName);
      } else if (data.action === "chunk") {
        setRecipeText((prev) => prev + data.chunk);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('EventSource error:', error); // Debug log
      eventSourceRef.current.close();
    };
  };

  const closeEventStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  async function onSubmit(data) {
    setRecipeText('');
    setRecipeData(data);
  }

  const generateRecipeImage = async (recipeName) => {
    try {
      const response = await fetch(`http://localhost:3001/generateImage?recipeName=${encodeURIComponent(recipeName)}`);
      if (!response.ok) throw new Error('Failed to generate image');
      
      const data = await response.json();
      setRecipeImage(`data:image/png;base64,${data.imageUrl}`);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 header-title" 
            style={{ 
              color: 'white',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
              letterSpacing: '1px',
            }}>
            Waste to Feast
          </h1>
          <p className="text-xl text-gray-100 max-w-2xl mx-auto" 
            style={{ 
              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
              lineHeight: '1.6',
            }}>
            Transform your ingredients into delicious meals with our AI-powered recipe generator. Reduce food waste and enjoy tasty dishes!
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
          {/* Left Column - Recipe Form */}
          <div className="w-full lg:w-[450px]">
        <RecipeCard onSubmit={onSubmit} />
          </div>

          {/* Right Column - Recipe Display */}
          <div className="w-full lg:w-[700px] min-h-[600px] bg-white rounded-xl shadow-lg overflow-hidden">
            {recipeText ? (
              <div className="p-8">
                {/* Recipe Title */}
                <h1 className="text-3xl font-playfair font-bold text-center mb-8 pb-4 border-b border-gray-200" style={{ color: '#1a202c' }}>
                  {recipeText.split('\n')[0]}
                </h1>

                {/* Recipe Image */}
                {recipeImage && (
                  <div className="mb-8 flex justify-center">
                    <img 
                      src={recipeImage} 
                      alt="Generated recipe" 
                      className="rounded-lg shadow-md max-w-[400px]"
                    />
                  </div>
                )}

                {/* Recipe Details Card */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {recipeText.match(/• Cuisine: (.*?)\n/)?.[1] && (
                    <div className="recipe-details-card p-4 rounded-lg">
                      <span className="block text-sm text-gray-500 mb-1">Cuisine</span>
                      <span className="font-semibold">{recipeText.match(/• Cuisine: (.*?)\n/)[1]}</span>
                    </div>
                  )}
                  {recipeText.match(/• Meal Type: (.*?)\n/)?.[1] && (
                    <div className="recipe-details-card p-4 rounded-lg">
                      <span className="block text-sm text-gray-500 mb-1">Meal Type</span>
                      <span className="font-semibold">{recipeText.match(/• Meal Type: (.*?)\n/)[1]}</span>
                    </div>
                  )}
                  {recipeText.match(/• Cooking Time: (.*?)\n/)?.[1] && (
                    <div className="recipe-details-card p-4 rounded-lg">
                      <span className="block text-sm text-gray-500 mb-1">Time</span>
                      <span className="font-semibold">{recipeText.match(/• Cooking Time: (.*?)\n/)[1]}</span>
                    </div>
                  )}
                  {recipeText.match(/• Complexity: (.*?)\n/)?.[1] && (
                    <div className="recipe-details-card p-4 rounded-lg">
                      <span className="block text-sm text-gray-500 mb-1">Complexity</span>
                      <span className="font-semibold">{recipeText.match(/• Complexity: (.*?)\n/)[1]}</span>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Ingredients */}
                  <div className="ingredients-section p-6 rounded-xl">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                      <span className="mr-2">🥗</span> Ingredients
                    </h2>
                    <ul className="space-y-2">
                      {recipeText
                        .split('INGREDIENTS')[1]
                        ?.split('INSTRUCTIONS')[0]
                        ?.split('\n')
                        .filter(line => line.includes('•'))
                        .map((ingredient, index) => (
                          <li key={index} className="flex items-start">
                            <span className="inline-block w-2 h-2 mt-2 mr-2 bg-green-500 rounded-full"></span>
                            <span className="text-gray-700">{ingredient.replace('•', '').trim()}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div className="instructions-section p-6 rounded-xl">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                      <span className="mr-2">👩‍🍳</span> Instructions
                    </h2>
                    <ol className="space-y-4">
                      {recipeText
                        .split('INSTRUCTIONS')[1]
                        ?.split('COOKING TIPS')[0]
                        ?.split('\n')
                        .filter(line => /^\d+\./.test(line))
                        .map((step, index) => (
                          <li key={index} className="flex">
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-sm mr-3 mt-1">
                              {index + 1}
                            </span>
                            <span className="text-gray-700">{step.replace(/^\d+\.\s*/, '').trim()}</span>
                          </li>
                        ))}
                    </ol>
                  </div>
                </div>

                {/* Cooking Tips */}
                <div className="mt-8 bg-yellow-50 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                    <span className="mr-2">💡</span> Cooking Tips
                  </h2>
                  <ul className="space-y-2">
                    {recipeText
                      .split('COOKING TIPS')[1]
                      ?.split('SERVINGS')[0]
                      ?.split('\n')
                      .filter(line => line.includes('•'))
                      .map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-2 h-2 mt-2 mr-2 bg-yellow-500 rounded-full"></span>
                          <span className="text-gray-700">{tip.replace('•', '').trim()}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Servings */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
                    <span className="mr-2">👥</span>
                    <span className="font-semibold text-gray-700">
                      Serves: {recipeText.match(/SERVINGS: (\d+)/)?.[1] || '4'} people
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-lg">Generate a recipe to see it here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
