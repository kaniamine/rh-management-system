using System;
using System;
using System.Linq;
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Diagnosers;

namespace Benchmarks
{
    [MemoryDiagnoser]
    public class WeatherForecastBenchmarks
    {
        private readonly string[] _summaries = new[]
        {
            "Freezing",
            "Bracing",
            "Chilly",
            "Cool",
            "Mild",
            "Warm",
            "Balmy",
            "Hot",
            "Sweltering",
            "Scorching"
        };

        [Benchmark]
        public (DateOnly Date, int TemperatureC, string Summary)[] GenerateForecasts()
        {
            return Enumerable.Range(1, 5).Select(index =>
                (DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    Random.Shared.Next(-20, 55),
                    _summaries[Random.Shared.Next(_summaries.Length)])
            ).ToArray();
        }
    }
}
