<?php

namespace Database\Seeders;

use App\Models\Classe;
use App\Models\Level;
use App\Models\Organizer;
use App\Models\Student;
use App\Models\StudentParent;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'nur.quran.school@gmail.com'],
            ['name' => 'Admin', 'password' => 'toumi1916', 'role' => 'admin', 'status' => 'active']
        );

        $organizerUser = User::firstOrCreate(
            ['email' => 'organizer@qsm.com'],
            ['name' => 'Organizer', 'password' => 'password', 'role' => 'organizer', 'status' => 'active']
        );

        if (!$organizerUser->organizer()->exists()) {
            Organizer::create([
                'user_id' => $organizerUser->id,
                'phone' => '1234567890',
                'qualifications' => 'Senior Organizer',
            ]);
        }

        $teacherUser = User::firstOrCreate(
            ['email' => 'teacher@qsm.com'],
            ['name' => 'Teacher', 'password' => 'password', 'role' => 'teacher', 'status' => 'active']
        );

        $teacher = $teacherUser->teacher()->firstOrCreate([
            'qualification' => 'Quran License',
            'specialization' => 'Tajweed',
            'join_date' => '2024-01-01',
        ]);

        $studentUser = User::firstOrCreate(
            ['email' => 'student@qsm.com'],
            ['name' => 'Student', 'password' => 'password', 'role' => 'student', 'status' => 'active']
        );

        $student = $studentUser->student()->firstOrCreate([
            'enrollment_date' => '2024-01-15',
            'date_of_birth' => '2010-05-15',
            'gender' => 'male',
            'address' => '123 Main St',
            'phone' => '0987654321',
        ]);

        $parentUser = User::firstOrCreate(
            ['email' => 'parent@qsm.com'],
            ['name' => 'Parent', 'password' => 'password', 'role' => 'parent', 'status' => 'active']
        );

        if (!$student->guardian_id) {
            $student->update(['guardian_id' => $parentUser->id]);
        }
        StudentParent::firstOrCreate([
            'student_id' => $student->id,
            'parent_id' => $parentUser->id,
        ]);

        $level1 = Level::firstOrCreate(['name' => 'Beginner'], ['description' => 'Basic Quran reading', 'order' => 1]);
        $level2 = Level::firstOrCreate(['name' => 'Intermediate'], ['description' => 'Intermediate memorization', 'order' => 2]);
        $level3 = Level::firstOrCreate(['name' => 'Advanced'], ['description' => 'Advanced memorization', 'order' => 3]);

        $sampleClass = Classe::firstOrCreate(
            ['name' => 'Beginner A'],
            ['level_id' => $level1->id, 'teacher_id' => $teacher->id, 'academic_year' => '2024-2025', 'max_students' => 20]
        );

        $sampleClass->enrollments()->firstOrCreate([
            'student_id' => $student->id,
        ], [
            'enrolled_date' => '2024-01-15',
            'status' => 'active',
        ]);

        Subject::firstOrCreate(['name' => 'Quran Memorization'], ['description' => 'Hifz of the Holy Quran']);
        Subject::firstOrCreate(['name' => 'Tajweed'], ['description' => 'Rules of Quran recitation']);
        Subject::firstOrCreate(['name' => 'Tafseer'], ['description' => 'Quran interpretation']);

        $this->call(SurahSeeder::class);
    }
}
