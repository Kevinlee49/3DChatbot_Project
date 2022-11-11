using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DemoLipSync : MonoBehaviour
{
    public LipSyncAnimator3D animator;

    private void Awake()
    {

    }

    public void ButtonPress(string name)
    {
        animator.PlayAnimation(name, name);
    }
   
}
