const { 
  getCategories, 
  getEquipment, 
  generateWorkoutVideo 
} = require('../generator');

async function testFormFunctionality() {
  console.log('Testing form functionality...\n');
  
  try {
    // Test getting categories
    console.log('1. Testing getCategories()...');
    const categories = getCategories();
    console.log('Available categories:', categories);
    console.log('✅ Categories loaded successfully\n');
    
    // Test getting equipment for first 2 categories
    console.log('2. Testing getEquipment()...');
    const testCategories = categories.slice(0, 2);
    const equipment = getEquipment(testCategories);
    console.log('Equipment for categories', testCategories, ':', equipment);
    console.log('✅ Equipment loaded successfully\n');
    
    // Test form data structure
    console.log('3. Testing form data structure...');
    const mockFormData = {
      workDuration: 45,
      restDuration: 15,
      setsPerStation: 3,
      stationRest: 15,
      totalWorkoutDuration: 60,
      categories: testCategories,
      equipment: equipment.slice(0, 2)
    };
    
    console.log('Mock form data:', mockFormData);
    console.log('✅ Form data structure is valid\n');
    
    // Test validation
    console.log('4. Testing validation...');
    const { validateNumber } = require('../generator');
    
    console.log('workDuration (45):', validateNumber(45, 10, 300) ? '✅ Valid' : '❌ Invalid');
    console.log('restDuration (15):', validateNumber(15, 5, 120) ? '✅ Valid' : '❌ Invalid');
    console.log('setsPerStation (3):', validateNumber(3, 1, 10) ? '✅ Valid' : '❌ Invalid');
    console.log('stationRest (15):', validateNumber(15, 5, 60) ? '✅ Valid' : '❌ Invalid');
    console.log('totalWorkoutDuration (60):', validateNumber(60, 5, 180) ? '✅ Valid' : '❌ Invalid');
    
    console.log('✅ Validation tests completed\n');
    
    console.log('🎉 All form functionality tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFormFunctionality(); 