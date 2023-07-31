import { useEffect, useState } from "react";
import axios from "axios";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import "./App.css";

function App() {
  const [educationData, setEducationData] = useState([]);
  const [countyData, setCountyData] = useState([]);

  useEffect(() => {
    // Fetch the education data and county data using Axios
    axios
      .all([
        axios.get(
          "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
        ),
        axios.get(
          "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
        ),
      ])
      .then(
        axios.spread((educationResponse, countyResponse) => {
          setEducationData(educationResponse.data);
          setCountyData(countyResponse.data);
          createChoroplethMap(educationResponse.data, countyResponse.data);
        })
      )
      .catch((error) => console.error(error));
  }, []);

  const createChoroplethMap = (educationData, countyData) => {
    // Constants for the dimensions of the SVG and the margins
    const margin = { top: 80, right: 25, bottom: 30, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create scales for color and legend
    const colorScale = d3
      .scaleQuantize()
      .domain([
        d3.min(educationData, (d) => d.bachelorsOrHigher),
        d3.max(educationData, (d) => d.bachelorsOrHigher),
      ])
      .range(d3.schemeBlues[5]);

    const legendScale = d3
      .scaleLinear()
      .domain([
        d3.min(educationData, (d) => d.bachelorsOrHigher),
        d3.max(educationData, (d) => d.bachelorsOrHigher),
      ])
      .range([0, width / 2]);

    // Create the SVG element and append a group to it
    const svg = d3
      .select("#choropleth")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create the counties
    svg
      .selectAll(".county")
      .data(topojson.feature(countyData, countyData.objects.counties).features)
      .enter()
      .append("path")
      .attr("class", "county")
      .attr("d", d3.geoPath())
      .attr("fill", (d) =>
        colorScale(educationData.find((e) => e.fips === d.id).bachelorsOrHigher)
      )
      .attr("data-fips", (d) => d.id)
      .attr(
        "data-education",
        (d) => educationData.find((e) => e.fips === d.id).bachelorsOrHigher
      )
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut);

    // Create the legend
    const legend = svg
      .append("g")
      .attr("id", "legend")
      .attr("transform", `translate(${width / 4}, ${height + 40})`);

    const legendAxis = d3
      .axisBottom(legendScale)
      .tickSize(13)
      .tickValues(colorScale.range().map((d) => colorScale.invertExtent(d)[0]));

    legend
      .selectAll("rect")
      .data(colorScale.range())
      .enter()
      .append("rect")
      .attr("x", (d, i) => i * (width / 10))
      .attr("y", 0)
      .attr("width", width / 10)
      .attr("height", 13)
      .attr("fill", (d) => d);

    legend.call(legendAxis);

    // Create the title and description
    svg
      .append("text")
      .attr("id", "title")
      .attr("x", width / 2)
      .attr("y", -30)
      .attr("text-anchor", "middle")
      .text("United States Educational Attainment");

    svg
      .append("text")
      .attr("id", "description")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .text(
        "Percentage of adults age 25 and older with a bachelor's degree or higher (2010-2014)"
      );

    // Create the tooltip
    const tooltip = svg.append("g").attr("id", "tooltip").style("opacity", 0);

    // Append a rectangle to act as the background of the tooltip
    tooltip
      .append("rect")
      .attr("width", 100)
      .attr("height", 50)
      .attr("fill", "white")
      .attr("stroke", "black");

    // Append text elements to display the tooltip content
    tooltip
      .append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("font-size", "14px")
      .text("FIPS: ");

    tooltip
      .append("text")
      .attr("x", 10)
      .attr("y", 40)
      .attr("font-size", "14px")
      .text("Education: ");
  };

  const handleMouseOver = (event) => {
    const tooltip = d3.select("#tooltip");
    tooltip.style("opacity", 0.9);
    tooltip
      .attr("transform", `translate(${event.pageX + 10}, ${event.pageY + 10})`)
      .select("text:nth-child(2)")
      .text(`FIPS: ${d3.select(event.target).attr("data-fips")}`);

    tooltip
      .select("text:nth-child(3)")
      .text(`Education: ${d3.select(event.target).attr("data-education")}%`);
  };

  const handleMouseOut = () => {
    d3.select("#tooltip").style("opacity", 0);
  };

  return (
    <div>
      <svg id="choropleth"></svg>
      <div id="tooltip" style={{ display: "none" }}></div>
    </div>
  );
}

export default App;
