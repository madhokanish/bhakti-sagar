package com.bhaktichat.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.bhaktichat.app.ui.navigation.BhaktiChatApp
import com.bhaktichat.app.ui.theme.BhaktiChatTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BhaktiChatTheme {
                BhaktiChatApp()
            }
        }
    }
}
