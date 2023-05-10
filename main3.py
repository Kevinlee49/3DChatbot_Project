from rake_nltk import Rake  # pip install rake-nltk
#import pyttsx3              # pip install pyttsx3
from transformers import BertTokenizer, BertForQuestionAnswering
from pubmedQ import runPubMed
from bert import runBERTModel
from universal_sentence_encoder import runuse
import tensorflow as tf
import tensorflow_hub as hub
import time
import json
import os
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
import torch
import nltk
nltk.download('stopwords')
nltk.download('punkt')

if torch.cuda.is_available(): 
 dev = "cuda:0" 
else: 
 dev = "cpu" 
device = torch.device(dev)
print(device)



def retrieveAbstract(limit, keyword_extracted, tokenizer, query):
    st = " ".join(keyword_extracted).split()

    data = {"version": "v1.0",
            "data": [{
                "abstracts": []
            }]}
    temp = data["data"][0]["abstracts"]

    if len(st) <= 2:
        terms = "+".join(st)
        temp += runPubMed(limit, terms, tokenizer, query, temp)
        return data
    else:
        for i in range(len(st)):
            removed = st.pop(i)
            terms = "+".join(st)
            temp += runPubMed(limit, terms, tokenizer, query, temp)
            st.insert(i, removed)
            time.sleep(1)
        return data


def loadAnswerToFile(answers):
    fileName = "answers.txt"
    print(len(answers))
    with open(fileName, 'w') as f:
        json.dump(answers, f)
    f.close()


def getAnswerSentence(fin_answer):
    res = "The final answer for your query is '"
    res += fin_answer['ans']
    res += "'. This answer is sourced within abtract of publication titled '"
    res += fin_answer['title']
    res += "' from the journal '"
    res += fin_answer['journal']
    res += "' by author(s) "
    res += fin_answer['author']
    res += ". "
    return res


def keyPhraseSearchTerm(limit, queries, tokenizer, bert_model, use_model):
    for query in queries:
        rake_nltk_var = Rake()
        rake_nltk_var.extract_keywords_from_text(query)
        keyword_extracted = rake_nltk_var.get_ranked_phrases()
        print("\nRetrieving abstract from PubMed...")
        print("Keyphrase: ", keyword_extracted)
        data = retrieveAbstract(limit, keyword_extracted, tokenizer, query)
        array = data["data"][0]["abstracts"]
        print("Number of abstracts returned: ", len(array))

        print("\nRunning model...")

        data_answers = runBERTModel(query, array, tokenizer, bert_model)
        fin_answer = runuse(use_model, data_answers)
      
        if fin_answer != None:
            print("Question: ", query)
            print("Total answers found: ", len(data_answers))
            print("\n\nAnswer: ", fin_answer['ans'])

            # TTS part - Speak out the final answer
           # text_speech = pyttsx3.init()
            #getAnswerSentence(fin_answer)
            #text_speech.runAndWait()
        #loadAnswerToFile(data_answers)
        print("\n\n")
     

def main():
    limit = str(1000)

    queries = []
    # query_elem = input("Enter query (eg: What causes autism?)")
    
    query_elem = "what are the main symptoms for autism?"
    # bring input question as arguments [1] , argument 가 리스트로 들어옴, 0번은 파일명 자체,
    # 1번부터는 사용자가 입력하는 것들.
    queries.append(query_elem)
    print(queries)

    # load bert tokenizer and model
    print("Loading tokenizer and models...")
    tokenizer = BertTokenizer.from_pretrained(
        'twmkn9/bert-base-uncased-squad2')
    bert_model = BertForQuestionAnswering.from_pretrained(
        'twmkn9/bert-base-uncased-squad2')
    bert_model = bert_model.to(device)
    

    
    use_module_url = "https://tfhub.dev/google/universal-sentence-encoder/4"
    # use_model = None
    

    use_model = hub.load(use_module_url)
    
    
    keyPhraseSearchTerm(limit, queries, tokenizer, bert_model, use_model)


if __name__ == "__main__":
    main()
