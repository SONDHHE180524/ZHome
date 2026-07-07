using System;
using System.Collections.Generic;
using System.Linq;
using ZHome.API.Models.Entities;
using ZHome.API.Models.DTOs;

namespace ZHome.API.Services
{
    public class MatchingService
    {
        public List<MatchResponseDto> FindMatches(MatchingProfile target, List<MatchingProfile> candidates)
        {
            var results = new List<MatchResponseDto>();

            foreach (var candidate in candidates)
            {
                if (candidate.StudentId == target.StudentId) continue;

                // 1. Gender compatibility check based on preference
                if (!IsGenderCompatible(target, candidate)) continue;
                if (!IsGenderCompatible(candidate, target)) continue;

                // 2. Compute compatibility score
                int score = 50; // Base score

                // Smoking compatibility (Crucial: 20 points)
                if (target.Smoke == candidate.Smoke)
                {
                    score += 20;
                }
                else
                {
                    score -= 10;
                }

                // Sleep schedule compatibility (15 points)
                if (target.SleepLate == candidate.SleepLate)
                {
                    score += 15;
                }
                else
                {
                    score -= 5;
                }

                // Pet compatibility (15 points)
                if (target.HasPet == candidate.HasPet)
                {
                    score += 15;
                }
                else
                {
                    // If one has a pet and the other doesn't, it might be fine, but reduce slightly
                    score -= 5;
                }

                // Budget alignment (15 points)
                // Check if candidate budget max is within target's budget max and vice versa
                var overlapMin = Math.Max(target.BudgetMin, candidate.BudgetMin);
                var overlapMax = Math.Min(target.BudgetMax, candidate.BudgetMax);

                if (overlapMax >= overlapMin)
                {
                    score += 15;
                }
                else
                {
                    // Budgets do not overlap
                    score -= 15;
                }

                // Hometown similarity (bonus: 5 points)
                if (!string.IsNullOrEmpty(target.Hometown) &&
                    !string.IsNullOrEmpty(candidate.Hometown) &&
                    target.Hometown.Equals(candidate.Hometown, StringComparison.OrdinalIgnoreCase))
                {
                    score += 5;
                }

                // Bound score between 0 and 100
                score = Math.Clamp(score, 0, 100);

                results.Add(new MatchResponseDto
                {
                    StudentId = candidate.StudentId,
                    FullName = candidate.Student?.FullName ?? "Sinh viên ẩn danh",
                    Phone = candidate.Student?.Phone ?? string.Empty,
                    Email = candidate.Student?.Email,
                    AvatarUrl = candidate.Student?.AvatarUrl,
                    Gender = candidate.Gender,
                    BudgetMin = candidate.BudgetMin,
                    BudgetMax = candidate.BudgetMax,
                    Smoke = candidate.Smoke,
                    SleepLate = candidate.SleepLate,
                    HasPet = candidate.HasPet,
                    Hometown = candidate.Hometown,
                    Description = candidate.Description,
                    RoommateGenderPreference = candidate.RoommateGenderPreference,
                    MatchPercentage = score
                });
            }

            return results.OrderByDescending(r => r.MatchPercentage).ToList();
        }

        private bool IsGenderCompatible(MatchingProfile user, MatchingProfile candidate)
        {
            if (user.RoommateGenderPreference == "Any") return true;
            return user.RoommateGenderPreference.Equals(candidate.Gender, StringComparison.OrdinalIgnoreCase);
        }
    }
}
