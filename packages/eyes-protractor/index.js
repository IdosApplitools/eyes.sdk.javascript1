const core = require('@applitools/eyes-sdk-core')

const {CheckSettings, EyesClassic, EyesVisualGrid, EyesFactory} = require('./src/sdk')

exports.Eyes = EyesFactory
exports.EyesProtractor = EyesClassic
exports.EyesVisualGrid = EyesVisualGrid
exports.Target = CheckSettings
exports.CheckSettings = CheckSettings

exports.AccessibilityLevel = core.AccessibilityLevel
exports.AccessibilityGuidelinesVersion = core.AccessibilityGuidelinesVersion
exports.AccessibilityMatchSettings = core.AccessibilityMatchSettings
exports.AccessibilityRegionType = core.AccessibilityRegionType
exports.BatchInfo = core.BatchInfo
exports.BrowserType = core.BrowserType
exports.Configuration = core.Configuration
exports.DeviceName = core.DeviceName
exports.IosDeviceName = core.IosDeviceName
exports.ExactMatchSettings = core.ExactMatchSettings
exports.FloatingMatchSettings = core.FloatingMatchSettings
exports.ImageMatchSettings = core.ImageMatchSettings
exports.MatchLevel = core.MatchLevel
exports.PropertyData = core.PropertyData
exports.ProxySettings = core.ProxySettings
exports.ScreenOrientation = core.ScreenOrientation
exports.StitchMode = core.StitchMode
exports.DebugScreenshotsProvider = core.DebugScreenshotsProvider
exports.FileDebugScreenshotsProvider = core.FileDebugScreenshotsProvider
exports.NullDebugScreenshotProvider = core.NullDebugScreenshotProvider
exports.EyesError = core.EyesError
exports.CoordinatesType = core.CoordinatesType
exports.Location = core.Location
exports.RectangleSize = core.RectangleSize
exports.Region = core.Region
exports.PropertyHandler = core.PropertyHandler
exports.ReadOnlyPropertyHandler = core.ReadOnlyPropertyHandler
exports.SimplePropertyHandler = core.SimplePropertyHandler
exports.ImageDeltaCompressor = core.ImageDeltaCompressor
exports.MutableImage = core.MutableImage
exports.ConsoleLogHandler = core.ConsoleLogHandler
exports.DebugLogHandler = core.DebugLogHandler
exports.FileLogHandler = core.FileLogHandler
exports.Logger = core.Logger
exports.LogHandler = core.LogHandler
exports.NullLogHandler = core.NullLogHandler

exports.ImageProvider = core.ImageProvider
exports.FullPageCaptureAlgorithm = core.FullPageCaptureAlgorithm
exports.EyesSimpleScreenshotFactory = core.EyesSimpleScreenshotFactory
exports.CorsIframeHandle = core.CorsIframeHandle
exports.CutProvider = core.CutProvider
exports.FixedCutProvider = core.FixedCutProvider
exports.NullCutProvider = core.NullCutProvider
exports.UnscaledFixedCutProvider = core.UnscaledFixedCutProvider
exports.ScaleProvider = core.ScaleProvider
exports.FixedScaleProvider = core.FixedScaleProvider
exports.FixedScaleProviderFactory = core.FixedScaleProviderFactory
exports.PositionMemento = core.PositionMemento
exports.PositionProvider = core.PositionProvider
exports.RemoteSessionEventHandler = core.RemoteSessionEventHandler
exports.SessionEventHandler = core.SessionEventHandler
exports.ValidationInfo = core.ValidationInfo
exports.ValidationResult = core.ValidationResult
exports.CoordinatesTypeConversionError = core.CoordinatesTypeConversionError
exports.DiffsFoundError = core.DiffsFoundError
exports.NewTestError = core.NewTestError
exports.OutOfBoundsError = core.OutOfBoundsError
exports.TestFailedError = core.TestFailedError
exports.MatchResult = core.MatchResult
exports.NullRegionProvider = core.NullRegionProvider
exports.RegionProvider = core.RegionProvider
exports.RunningSession = core.RunningSession
exports.SessionType = core.SessionType
exports.FailureReports = core.FailureReports
exports.TestResults = core.TestResults
exports.TestResultsFormatter = core.TestResultsFormatter
exports.TestResultsStatus = core.TestResultsStatus
exports.TestResultContainer = core.TestResultContainer
exports.TestResultsSummary = core.TestResultsSummary
exports.ClassicRunner = core.ClassicRunner
exports.VisualGridRunner = core.VisualGridRunner
