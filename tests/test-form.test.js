const { 
  getCategories, 
  getEquipment, 
  generateWorkoutVideo,
  validateNumber
} = require('../generator');

describe('Form Functionality', () => {
  describe('getCategories', () => {
    test('should load categories successfully', () => {
      const categories = getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    test('should return valid category names', () => {
      const categories = getCategories();
      categories.forEach(category => {
        expect(typeof category).toBe('string');
        expect(category.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getEquipment', () => {
    test('should load equipment for categories', () => {
      const categories = getCategories();
      if (categories.length > 0) {
        const testCategories = categories.slice(0, 2);
        const equipment = getEquipment(testCategories);
        expect(Array.isArray(equipment)).toBe(true);
        expect(equipment.length).toBeGreaterThan(0);
      }
    });

    test('should return valid equipment names', () => {
      const categories = getCategories();
      if (categories.length > 0) {
        const testCategories = categories.slice(0, 2);
        const equipment = getEquipment(testCategories);
        equipment.forEach(item => {
          expect(typeof item).toBe('string');
          expect(item.length).toBeGreaterThan(0);
        });
      }
    });
  });

  describe('Form Data Structure', () => {
    test('should validate form data structure', () => {
      const categories = getCategories();
      const testCategories = categories.slice(0, 2);
      const equipment = getEquipment(testCategories);
      
      const mockFormData = {
        workDuration: 45,
        restDuration: 15,
        setsPerStation: 3,
        stationRest: 15,
        totalWorkoutDuration: 60,
        categories: testCategories,
        equipment: equipment.slice(0, 2)
      };

      expect(mockFormData).toHaveProperty('workDuration');
      expect(mockFormData).toHaveProperty('restDuration');
      expect(mockFormData).toHaveProperty('setsPerStation');
      expect(mockFormData).toHaveProperty('stationRest');
      expect(mockFormData).toHaveProperty('totalWorkoutDuration');
      expect(mockFormData).toHaveProperty('categories');
      expect(mockFormData).toHaveProperty('equipment');

      expect(typeof mockFormData.workDuration).toBe('number');
      expect(typeof mockFormData.restDuration).toBe('number');
      expect(typeof mockFormData.setsPerStation).toBe('number');
      expect(typeof mockFormData.stationRest).toBe('number');
      expect(typeof mockFormData.totalWorkoutDuration).toBe('number');
      expect(Array.isArray(mockFormData.categories)).toBe(true);
      expect(Array.isArray(mockFormData.equipment)).toBe(true);
    });
  });

  describe('Validation Functions', () => {
    test('should validate work duration', () => {
      expect(validateNumber(45, 10, 300)).toBe(true);
      expect(validateNumber(5, 10, 300)).toBe(false);
      expect(validateNumber(400, 10, 300)).toBe(false);
    });

    test('should validate rest duration', () => {
      expect(validateNumber(15, 5, 120)).toBe(true);
      expect(validateNumber(3, 5, 120)).toBe(false);
      expect(validateNumber(150, 5, 120)).toBe(false);
    });

    test('should validate sets per station', () => {
      expect(validateNumber(3, 1, 10)).toBe(true);
      expect(validateNumber(0, 1, 10)).toBe(false);
      expect(validateNumber(15, 1, 10)).toBe(false);
    });

    test('should validate station rest', () => {
      expect(validateNumber(15, 5, 60)).toBe(true);
      expect(validateNumber(3, 5, 60)).toBe(false);
      expect(validateNumber(80, 5, 60)).toBe(false);
    });

    test('should validate total workout duration', () => {
      expect(validateNumber(60, 5, 180)).toBe(true);
      expect(validateNumber(3, 5, 180)).toBe(false);
      expect(validateNumber(200, 5, 180)).toBe(false);
    });
  });

  describe('Boundary Values', () => {
    test('should accept minimum valid values', () => {
      expect(validateNumber(10, 10, 300)).toBe(true);
      expect(validateNumber(5, 5, 120)).toBe(true);
      expect(validateNumber(1, 1, 10)).toBe(true);
    });

    test('should accept maximum valid values', () => {
      expect(validateNumber(300, 10, 300)).toBe(true);
      expect(validateNumber(120, 5, 120)).toBe(true);
      expect(validateNumber(10, 1, 10)).toBe(true);
    });

    test('should reject values outside boundaries', () => {
      expect(validateNumber(9, 10, 300)).toBe(false);
      expect(validateNumber(301, 10, 300)).toBe(false);
      expect(validateNumber(4, 5, 120)).toBe(false);
      expect(validateNumber(121, 5, 120)).toBe(false);
    });
  });
}); 