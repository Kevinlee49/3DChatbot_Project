using UnityEngine;
using UnityEngine.UI;
using UnityEngine.Windows.Speech;

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using UnityEngine.Networking;

/// <summary>
/// dictation mode is the mode where the PC tries to recognize the speech with out any assistnace or guidance. it is the most clear way.
/// 
/// Hypotethis are thrown super fast, but could have mistakes.
/// Resulted complete phrase will be determined once the person stops speaking. the best guess from the PC will go on the result.
/// 
/// for grammer controls and ruels see here
/// https://www.w3.org/TR/speech-grammar/
/// 
/// added by shachar oz
/// </summary>

public class SpeechRecog : MonoBehaviour
{
    public Text ResultedText;
    public ArrayList InputQuestions = new ArrayList();
    public ArrayList InputAnswers = new ArrayList();

    protected DictationRecognizer dictationRecognizer;

    [System.Serializable]
    public class UnityEventString : UnityEngine.Events.UnityEvent<string> { };
    public UnityEventString OnPhraseRecognized;

    public UnityEngine.Events.UnityEvent OnUserStartedSpeaking;

    private bool isUserSpeaking;
    private string path = @"D:\unity\results.csv";

    void Start()
    {
        if (!File.Exists(path))
        {
            using (File.Create(path))
            {
                UnityEngine.Debug.Log("results.csv created.");
            }
        }
        else
        {
            UnityEngine.Debug.Log("results.csv already exists.");
        }
        StartDictationEngine();
    }

    /// <summary>
    /// Hypotethis are thrown super fast, but could have mistakes.
    /// </summary>
    /// <param name="text"></param>
    private void DictationRecognizer_OnDictationHypothesis(string text)
    {
        // Debug.LogFormat("Dictation hypothesis: {0}", text);

        if (isUserSpeaking == false)
        {
            isUserSpeaking = true;
            OnUserStartedSpeaking.Invoke();
        }
    }

    /// <summary>
    /// thrown when engine has some messages, that are not specifically errors
    /// </summary>
    /// <param name="completionCause"></param>
    private void DictationRecognizer_OnDictationComplete(DictationCompletionCause completionCause)
    {
        if (completionCause != DictationCompletionCause.Complete)
        {
            UnityEngine.Debug.LogWarningFormat("Dictation completed unsuccessfully: {0}.", completionCause);


            switch (completionCause)
            {
                case DictationCompletionCause.TimeoutExceeded:
                case DictationCompletionCause.PauseLimitExceeded:
                    //we need a restart
                    CloseDictationEngine();
                    StartDictationEngine();
                    break;

                case DictationCompletionCause.UnknownError:
                case DictationCompletionCause.AudioQualityFailure:
                case DictationCompletionCause.MicrophoneUnavailable:
                case DictationCompletionCause.NetworkFailure:
                    //error without a way to recover
                    CloseDictationEngine();
                    break;

                case DictationCompletionCause.Canceled:
                //happens when focus moved to another application 

                case DictationCompletionCause.Complete:
                    CloseDictationEngine();
                    StartDictationEngine();
                    break;
            }
        }
    }

    /// <summary>
    /// Resulted complete phrase will be determined once the person stops speaking. the best guess from the PC will go on the result.
    /// </summary>
    /// <param name="text"></param>
    /// <param name="confidence"></param>
    private void DictationRecognizer_OnDictationResult(string text, ConfidenceLevel confidence)
    {
        UnityEngine.Debug.LogFormat("Dictation result: {0}", text);
        if (ResultedText) ResultedText.text += text + "\n";

        if (isUserSpeaking == true)
        {
            isUserSpeaking = false;
            OnPhraseRecognized.Invoke(text);
            SaveDictationResults(text);
        }
    }

    private string GetAnswer(string question)
    {
        string pythonFilePath = @"C:\Users\Kevin\anaconda3\envs\medical_query\python.exe";
        ProcessStartInfo psi = new ProcessStartInfo
        {
            FileName = pythonFilePath,
            Arguments = @"C:\Users\Kevin\main2.py", // file path
            UseShellExecute = false, // do not use OS shell
            CreateNoWindow = true, // we don't need a new window
            RedirectStandardOutput = true, // any output, generated by application will be redirected back
            RedirectStandardError = true
        };

        var errors = string.Empty;
        var results = string.Empty;
        if (File.Exists(pythonFilePath))
        {
            try
            {
                UnityEngine.Debug.Log("Python file exist!!!");
                using (Process process = Process.Start(psi))
                {
                    UnityEngine.Debug.Log("Python proccess started!!!");
                    using (StreamReader reader = process.StandardOutput)
                    {
                        while (!process.HasExited)
                        {
                            UnityEngine.Debug.Log(reader.ReadLine());
                        }

                        // errors = process.RedirectStandardError.ReadToEnd();
                        results = process.StandardOutput.ReadToEnd();
                    }
                }

                // UnityEngine.Debug.Log(errors); // debug does not contain a definition for 'Error'
                // UnityEngine.Debug.Log(results);

            }
            catch
            {
                UnityEngine.Debug.Log("error");
            }
        }

        return "test";
    }

    public void SaveDictationResults(string text)
    {
        if (!String.IsNullOrEmpty(text))
        {
            InputQuestions.Add(text);
            string answer = GetAnswer(text);
            InputAnswers.Add(answer);
        }
        // foreach (string result in InputQuestions)
        // {
        //      Debug.Log(result);
        // }

    }

    ~SpeechRecog()
    {
        SaveResult();
    }

    private void SaveResult()
    {
        if (InputQuestions.Count > 0 && InputAnswers.Count > 0)
        {
            StreamWriter writer;
            writer = File.AppendText(path);
            string questionListString = String.Join(",", InputQuestions.ToArray());
            string answerListString = String.Join(",", InputAnswers.ToArray());
            // Debug.Log(questionListString);
            // Debug.Log(answerListString);
            writer.WriteLine(questionListString);
            writer.WriteLine(answerListString);
            writer.Close();
        }
    }


    private void DictationRecognizer_OnDictationError(string error, int hresult)
    {
        UnityEngine.Debug.LogErrorFormat("Dictation error: {0}; HResult = {1}.", error, hresult);
    }



    private void OnApplicationQuit()
    {
        CloseDictationEngine();
    }

    private void StartDictationEngine()
    {
        isUserSpeaking = false;

        dictationRecognizer = new DictationRecognizer();

        dictationRecognizer.DictationHypothesis += DictationRecognizer_OnDictationHypothesis;
        dictationRecognizer.DictationResult += DictationRecognizer_OnDictationResult;
        dictationRecognizer.DictationComplete += DictationRecognizer_OnDictationComplete;
        dictationRecognizer.DictationError += DictationRecognizer_OnDictationError;

        dictationRecognizer.Start();
    }

    private void CloseDictationEngine()
    {
        if (dictationRecognizer != null)
        {
            dictationRecognizer.DictationHypothesis -= DictationRecognizer_OnDictationHypothesis;
            dictationRecognizer.DictationComplete -= DictationRecognizer_OnDictationComplete;
            dictationRecognizer.DictationResult -= DictationRecognizer_OnDictationResult;
            dictationRecognizer.DictationError -= DictationRecognizer_OnDictationError;

            if (dictationRecognizer.Status == SpeechSystemStatus.Running)
                dictationRecognizer.Stop();

            dictationRecognizer.Dispose();
        }
    }
}