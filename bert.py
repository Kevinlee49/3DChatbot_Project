import torch
import re

device = torch.device('cuda')

def runBERT(question, context, tokenizer, model):
    context = context.lower()
    inputs = tokenizer(question, context, return_tensors='pt')
    inputs = inputs.to(device)
    start_positions = torch.tensor([1]).to(device)
    end_positions = torch.tensor([3]).to(device)
    outputs = model(**inputs, start_positions=start_positions, end_positions=end_positions)
    loss = outputs.loss
    start_scores = outputs.start_logits.to(device)
    end_scores = outputs.end_logits.to(device)
    p_start = torch.max(start_scores).item()
    p_end = torch.max(end_scores).item()
    all_tokens = tokenizer.convert_ids_to_tokens(inputs.input_ids[0])
    ans_arr = all_tokens[torch.argmax(start_scores) : torch.argmax(end_scores)+1]

    ques_arr = tokenizer.encode(question)
    if len(ans_arr)+1 > len(ques_arr):
        for i in range(len(ques_arr)):
            if ans_arr[i+1] in ques_arr[i]:
                ans_arr[i+1] = ""
            if i+2 == len(ans_arr):
                break
    ans_string = ' '.join(ans_arr).replace("[CLS]", "").replace("[SEP]","").replace(" ##","").strip()
    return ans_string

# pick answer by prioritizing front of array
def pickAns(ans):
    for a in ans:
        if a != '':
            return a
    return ''

def runBERTModel(question, array, tokenizer, model):
    question = question.lower()

    for publication in array:
        parts = publication["parts"]
        cur_p = ""
        ans = []
        exception_bool = False
        to_print = ""
        #run each parts
        for part in parts:
            cur_p = part
            try:
                cur_bert = runBERT(question, cur_p, tokenizer, model)
                ans.insert(0, cur_bert) # insert answer at the front
                to_print += part + "\n"
                to_print += "ans: " + cur_bert + "\n"
            except Exception as e:
                print("error! ", e)
                cur_bert = ""
                exception_bool = True
                break
            cur_p = cur_bert
        fin_ans = pickAns(ans)
        if fin_ans == "":
            print(publication['abs'])
            print(publication['parts'])
        if exception_bool == False and fin_ans != '':
            publication["ans"] = fin_ans
            # print(publication["id"])
            # print(to_print, "final answer: ", fin_ans, "\n")

    answers = [p for p in array if "ans" in p]
    return answers
