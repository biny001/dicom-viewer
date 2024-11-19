"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  Ruler,
  Search,
  SwitchCamera,
  Contrast,
  RefreshCcw,
  Folders,
} from "lucide-react";
import { getDwvVersion, decoderScripts, App } from "dwv";

// Define the decoder scripts
decoderScripts.jpeg2000 = "/assets/dwv/decoders/pdfjs/decode-jpeg2000.js";
decoderScripts["jpeg-lossless"] =
  "/assets/dwv/decoders/rii-mango/decode-jpegloss.js";
decoderScripts["jpeg-baseline"] =
  "/assets/dwv/decoders/pdfjs/decode-jpegbaseline.js";
decoderScripts.rle = "/assets/dwv/decoders/dwv/decode-rle.js";

const DwvComponent = () => {
  const dwvAppRef = useRef(null); // Reference to DWV App instance
  const [selectedTool, setSelectedTool] = useState("Select Tool");
  const [loadProgress, setLoadProgress] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [orientation, setOrientation] = useState("axial");
  const [tools, setTools] = useState({
    Scroll: {},
    ZoomAndPan: {},
    WindowLevel: {},
    Draw: { options: ["Ruler", "Ellipse", "Rectangle"] },
  });

  const dropboxDivId = "dropbox"; // ID for the drag-and-drop box
  const hoverClassName = "bg-gray-100"; // Tailwind class for hover effect

  // Initialize DWV App on mount
  useEffect(() => {
    document.addEventListener("touchstart", () => {}, { passive: true });
    const app = new App();
    dwvAppRef.current = app;

    app.init({
      containerDivId: "layerGroup0",
      tools: tools,
    });

    app.addEventListener("load-progress", (event) => {
      setLoadProgress(event.loaded);
    });

    app.addEventListener("load-end", () => {
      setDataLoaded(true);
      console.log("Data loaded successfully.");
    });

    return () => {
      if (dwvAppRef.current) {
        dwvAppRef.current.reset();
      }
    };
  }, [tools]);

  // Tool selection handler
  const onChangeTool = (tool) => {
    if (dwvAppRef.current) {
      setSelectedTool(tool);
      dwvAppRef.current.setTool(tool);
    }
  };

  // Orientation toggle handler
  const toggleOrientation = () => {
    let newOrientation;

    if (typeof orientation !== "undefined") {
      if (orientation === "axial") {
        newOrientation = "coronal";
      } else if (orientation === "coronal") {
        newOrientation = "sagittal";
      } else if (orientation === "sagittal") {
        newOrientation = "axial";
      }
    } else {
      // Default orientation
      newOrientation = "coronal";
    }

    // Update the state for orientation
    setOrientation(newOrientation);

    // Update the data view configuration
    const config = {
      "*": [
        {
          divId: "layerGroup0",
          orientation: newOrientation,
        },
      ],
    };

    if (dwvApp.current) {
      dwvApp.current.setDataViewConfigs(config);

      // Render the data
      const dataIds = dwvApp.current.getDataIds();
      for (const dataId of dataIds) {
        dwvApp.current.render(dataId);
      }
    } else {
      console.error("DWV App is not initialized!");
    }
  };

  // File drop handler
  const onDrop = (event) => {
    event.preventDefault();
    console.log("Files dropped:", event.dataTransfer.files); // Log dropped files
    if (dwvAppRef.current) {
      dwvAppRef.current.loadFiles(event.dataTransfer.files);
    }
  };

  // File input handler
  const onInputFile = (event) => {
    console.log("Files selected:", event.target.files);

    // Log selected files
    if (event.target.files && dwvAppRef.current) {
      dwvAppRef.current.loadFiles(event.target.files);
    }
  };

  // Drag over handler for dropbox
  const onBoxDragOver = (event) => {
    event.preventDefault();
    const box = document.getElementById(dropboxDivId);
    if (box && !box.classList.contains(hoverClassName)) {
      box.classList.add(hoverClassName);
    }
    console.log("Dragging over the dropzone");
  };

  // Drag leave handler for dropbox
  const onBoxDragLeave = (event) => {
    event.preventDefault();
    const box = document.getElementById(dropboxDivId);
    if (box) {
      box.classList.remove(hoverClassName);
    }
    console.log("Dragging left the dropzone");
  };

  // Set up event listeners for drag and drop
  useEffect(() => {
    const box = document.getElementById(dropboxDivId);

    if (box) {
      box.addEventListener("dragover", onBoxDragOver);
      box.addEventListener("dragleave", onBoxDragLeave);
      box.addEventListener("drop", onDrop);
    }

    return () => {
      if (box) {
        box.removeEventListener("dragover", onBoxDragOver);
        box.removeEventListener("dragleave", onBoxDragLeave);
        box.removeEventListener("drop", onDrop);
      }
    };
  }, []);

  // Check if image is loaded
  useEffect(() => {
    if (dataLoaded) {
      console.log("Image loaded and ready to be displayed");
    }
  }, [dataLoaded]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen flex flex-col space-y-4">
      <div
        id={dropboxDivId}
        className={`border-2 border-dashed border-gray-400 rounded-md p-4 text-center ${
          dataLoaded ? "h-12" : "h-32"
        } transition-all duration-300`}
      >
        {!dataLoaded && (
          <p className="text-sm text-gray-600">
            Drag and drop data here or{" "}
            <label
              htmlFor="input-file"
              className="text-blue-500 underline cursor-pointer"
            >
              click here
            </label>
          </p>
        )}
        <input
          id="input-file"
          type="file"
          className="hidden"
          onChange={onInputFile}
        />
      </div>

      <div
        id="layerGroup0"
        className={`border rounded-md p-4 bg-white flex-grow transition-all duration-300 ${
          dataLoaded ? "h-[calc(100vh-50px)]" : "h-[calc(100vh-300px)]"
        }`}
      >
        {dataLoaded ? (
          <p className="text-gray-600 text-center">Image Viewer Loaded</p>
        ) : (
          <p className="text-gray-600 text-center">No image loaded yet.</p>
        )}
      </div>

      <div className="mt-4 flex items-center space-x-4">
        {Object.keys(tools).map((tool) => (
          <button
            key={tool}
            className={`p-2 rounded-md ${
              selectedTool === tool
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            } hover:bg-blue-400`}
            onClick={() => onChangeTool(tool)}
          >
            {tool}
          </button>
        ))}
        <button
          value={"toggleOrientation"}
          className="p-2 bg-gray-200 hover:bg-blue-400 rounded-md text-gray-800"
          onClick={toggleOrientation}
        >
          Toggle Orientation
        </button>
        <button
          className="p-2 bg-gray-200 hover:bg-blue-400 rounded-md text-gray-800"
          onClick={() => dwvAppRef.current?.resetDisplay()}
        >
          <RefreshCcw /> Reset
        </button>
      </div>
    </div>
  );
};

export default DwvComponent;
