<?php

namespace Database\Seeders;

use App\Models\Classe;
use App\Models\Level;
use App\Models\Organizer;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@qsm.com',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $organizerUser = User::create([
            'name' => 'Organizer',
            'email' => 'organizer@qsm.com',
            'password' => 'password',
            'role' => 'organizer',
            'status' => 'active',
        ]);

        Organizer::create([
            'user_id' => $organizerUser->id,
            'phone' => '1234567890',
            'qualifications' => 'Senior Organizer',
        ]);

        $teacherUser = User::create([
            'name' => 'Teacher',
            'email' => 'teacher@qsm.com',
            'password' => 'password',
            'role' => 'teacher',
            'status' => 'active',
        ]);

        $teacher = Teacher::create([
            'user_id' => $teacherUser->id,
            'qualification' => 'Quran License',
            'specialization' => 'Tajweed',
            'join_date' => '2024-01-01',
        ]);

        $studentUser = User::create([
            'name' => 'Student',
            'email' => 'student@qsm.com',
            'password' => 'password',
            'role' => 'student',
            'status' => 'active',
        ]);

        $student = Student::create([
            'user_id' => $studentUser->id,
            'enrollment_date' => '2024-01-15',
            'date_of_birth' => '2010-05-15',
            'gender' => 'male',
            'address' => '123 Main St',
            'phone' => '0987654321',
        ]);

        User::create([
            'name' => 'Parent',
            'email' => 'parent@qsm.com',
            'password' => 'password',
            'role' => 'parent',
            'status' => 'active',
        ]);

        $level1 = Level::create(['name' => 'Beginner', 'description' => 'Basic Quran reading', 'order' => 1]);
        $level2 = Level::create(['name' => 'Intermediate', 'description' => 'Intermediate memorization', 'order' => 2]);
        $level3 = Level::create(['name' => 'Advanced', 'description' => 'Advanced memorization', 'order' => 3]);

        $sampleClass = Classe::create([
            'level_id' => $level1->id,
            'teacher_id' => $teacher->id,
            'name' => 'Beginner A',
            'academic_year' => '2024-2025',
            'max_students' => 20,
        ]);

        $sampleClass->enrollments()->create([
            'student_id' => $student->id,
            'enrolled_date' => '2024-01-15',
            'status' => 'active',
        ]);

        Subject::create(['name' => 'Quran Memorization', 'description' => 'Hifz of the Holy Quran']);
        Subject::create(['name' => 'Tajweed', 'description' => 'Rules of Quran recitation']);
        Subject::create(['name' => 'Tafseer', 'description' => 'Quran interpretation']);

        $this->call(SurahSeeder::class);
    }
}
