import { supabase } from '../lib/supabase';
import { ClassFormValues } from '../lib/validations/class';

// Define the Class type
export interface Class {
  id: string;
  name: string;
  description: string;
  instructor: string;
  capacity: number;
  duration: number;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
  category: string;
  difficulty: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
  current_enrollments: number;
}

// Fetch all classes with enrollment counts
export const fetchClasses = async (): Promise<Class[]> => {
  try {
    // Fetch classes
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });

    if (classesError) throw classesError;

    // Fetch all active enrollments
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('class_enrollments')
      .select('class_id, status')
      .eq('status', 'active');

    if (enrollmentsError) throw enrollmentsError;

    // Count enrollments for each class manually
    const enrollmentCounts: Record<string, number> = {};
    enrollmentsData?.forEach((item) => {
      if (!enrollmentCounts[item.class_id]) {
        enrollmentCounts[item.class_id] = 0;
      }
      enrollmentCounts[item.class_id]++;
    });

    // Transform the data to match our Class interface
    const transformedClasses: Class[] = classesData?.map((cls) => ({
      id: cls.id,
      name: cls.name,
      description: cls.description,
      instructor: cls.instructor,
      capacity: cls.capacity,
      duration: cls.duration,
      day: cls.day,
      startTime: cls.start_time.substring(0, 5), // Format: HH:MM
      endTime: cls.end_time.substring(0, 5), // Format: HH:MM
      location: cls.location,
      category: cls.category,
      difficulty: cls.difficulty,
      isActive: cls.is_active,
      created_at: cls.created_at,
      updated_at: cls.updated_at,
      current_enrollments: enrollmentCounts[cls.id] || 0,
    })) || [];

    return transformedClasses;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

// Add a new class
export const addClass = async (data: ClassFormValues): Promise<Class> => {
  try {
    // Prepare the data for Supabase (convert camelCase to snake_case)
    const classData = {
      name: data.name,
      description: data.description,
      instructor: data.instructor,
      capacity: data.capacity,
      duration: data.duration,
      day: data.day,
      start_time: data.startTime,
      end_time: data.endTime,
      location: data.location,
      category: data.category,
      difficulty: data.difficulty,
      is_active: data.isActive,
    };

    // Insert the new class into Supabase
    const { data: newClassData, error } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single();

    if (error) throw error;

    // Transform the returned data to match our Class interface
    const newClass: Class = {
      id: newClassData.id,
      name: newClassData.name,
      description: newClassData.description,
      instructor: newClassData.instructor,
      capacity: newClassData.capacity,
      duration: newClassData.duration,
      day: newClassData.day,
      startTime: newClassData.start_time.substring(0, 5),
      endTime: newClassData.end_time.substring(0, 5),
      location: newClassData.location,
      category: newClassData.category,
      difficulty: newClassData.difficulty,
      isActive: newClassData.is_active,
      created_at: newClassData.created_at,
      updated_at: newClassData.updated_at,
      current_enrollments: 0,
    };

    return newClass;
  } catch (error) {
    console.error('Error adding class:', error);
    throw error;
  }
};

// Update an existing class
export const updateClass = async (id: string, data: ClassFormValues): Promise<Class> => {
  try {
    // Prepare the data for Supabase (convert camelCase to snake_case)
    const classData = {
      name: data.name,
      description: data.description,
      instructor: data.instructor,
      capacity: data.capacity,
      duration: data.duration,
      day: data.day,
      start_time: data.startTime,
      end_time: data.endTime,
      location: data.location,
      category: data.category,
      difficulty: data.difficulty,
      is_active: data.isActive,
    };

    // Update the class in Supabase
    const { data: updatedClassData, error } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Get the current enrollment count
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('class_enrollments')
      .select('id')
      .eq('class_id', id)
      .eq('status', 'active');

    if (enrollmentError) {
      throw enrollmentError;
    }

    // Count the enrollments
    const enrollmentCount = enrollmentData ? enrollmentData.length : 0;

    // Transform the returned data to match our Class interface
    const updatedClass: Class = {
      id: updatedClassData.id,
      name: updatedClassData.name,
      description: updatedClassData.description,
      instructor: updatedClassData.instructor,
      capacity: updatedClassData.capacity,
      duration: updatedClassData.duration,
      day: updatedClassData.day,
      startTime: updatedClassData.start_time.substring(0, 5),
      endTime: updatedClassData.end_time.substring(0, 5),
      location: updatedClassData.location,
      category: updatedClassData.category,
      difficulty: updatedClassData.difficulty,
      isActive: updatedClassData.is_active,
      created_at: updatedClassData.created_at,
      updated_at: updatedClassData.updated_at,
      current_enrollments: enrollmentCount,
    };

    return updatedClass;
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

// Delete a class
export const deleteClass = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting class:', error);
    throw error;
  }
};
